import os
import json
import re
import subprocess
from datetime import datetime
from dotenv import load_dotenv
from typing import Annotated
from typing_extensions import TypedDict

from mcp.server.fastmcp import FastMCP
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore

load_dotenv()

# Initialize FastMCP Server
mcp = FastMCP("AutoDeepResearchNode")

def merge_dicts(old: dict, new: dict) -> dict:
    if old is None:
        old = {}
    return {**old, **new}

def extract_json(text: str) -> dict:
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("No JSON object found in model output")
    return json.loads(match.group())

# Graph State
class State(TypedDict):
    Query: str
    HeadNodes: Annotated[list, add_messages]
    DistributedWork: dict          
    currentTask: str              
    currentKey: str                 
    worker_outputs: Annotated[dict, merge_dicts]
    workerNodes: int
    useDocument: str

# LLM Used
llm_gemini = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

# 1st Node
def StartNode(state: dict):
    if state.get("useDocument", "no").lower() == "yes":
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        vector_db = QdrantVectorStore.from_existing_collection(
            embedding=embeddings,
            url="http://localhost:6333",
            collection_name="DocumentsforAI"
        )
        search_results = vector_db.similarity_search(state["Query"])
        context = "\n\n\n".join([f"Page Content : {result.page_content} \n Page Number : {result.metadata.get('page_label', '?')} \n File Location :{result.metadata.get('source', '?')}" for result in search_results])
        messages = [
            SystemMessage(content=f"Perform deep research and provide a detailed response. use the Following Content:{context}"),
            HumanMessage(content=state["Query"])
        ] 
        deepResearch = llm_gemini.invoke(messages)
    else:
        messages = [
            SystemMessage(content="You are a Professional Research Team Leader, Your task is to give an Introdution to the Topic and the Recent Treands around the topic.Your Response will be Just like the Leaders Short address in Team Presentation. It will be Short and Precise."),
            HumanMessage(content=state["Query"])
        ] 
        deepResearch = llm_gemini.invoke(messages)

    return {"HeadNodes": [deepResearch]}

# 2nd Node
def DividerNode(state: dict):
    workerNodes = state.get("workerNodes", 2)
    if state.get("useDocument", "no").lower() == "yes":
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        vector_db = QdrantVectorStore.from_existing_collection(
            embedding=embeddings,
            url="http://localhost:6333",
            collection_name="DocumentsforAI"
        )
        search_results = vector_db.similarity_search(state["Query"])
        context = "\n\n\n".join([f"Page Content : {result.page_content} \n Page Number : {result.metadata.get('page_label', '?')} \n File Location :{result.metadata.get('source', '?')}" for result in search_results])
        messages = [
            SystemMessage(content=f"You are a professional research Leader who's job is to orcharstrate the entire team, So you have to Analyse and use this info {state['HeadNodes'][0].content} and find out all possible angles and aspects of the research topic and divide the research into {workerNodes} so that Each Node can Perform Seperate and In depth Research and use the Following Content for Better Understanding of the Topic : {context}"),
            HumanMessage(content=f"""Research:{state["HeadNodes"][0].content} Query:{state["Query"]} Workers: {workerNodes}Return ONLY and ONLY valid JSON in this format: {{"Node1": "...", "Node2": "..."}} , Nothing Else""")
        ]
    else:
        messages = [
            SystemMessage(content=f"You are a professional research Leader who's job is to orcharstrate the entire team, So you have to Analyse and use this info {state['HeadNodes'][0].content} and find out all possible angles and aspects of the research topic and divide the research into {workerNodes} so that Each Node can Perform Seperate and In depth Research."),
            HumanMessage(content=f"""Research:{state["HeadNodes"][0].content} Query:{state["Query"]} Workers: {workerNodes}Return ONLY and ONLY valid JSON in this format: {{"Node1": "...", "Node2": "..."}} Nothing Else""")
        ]
    response = llm_gemini.invoke(messages)
    distributedWork = extract_json(response.content)
    return {"DistributedWork": distributedWork}

# 3rd Node
def WorkerNode(state: dict):
    task = state["currentTask"]
    if state.get("useDocument", "no").lower() == "yes":
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        vector_db = QdrantVectorStore.from_existing_collection(
            embedding=embeddings,
            url="http://localhost:6333",
            collection_name="DocumentsforAI"
        )
        search_results = vector_db.similarity_search(task)
        context = "\n\n\n".join([f"Page Content : {result.page_content} \n Page Number : {result.metadata.get('page_label', '?')} \n File Location :{result.metadata.get('source', '?')}" for result in search_results])
        messages = [
            SystemMessage(content=f"You are a Professional Research Analyst, Your task is to perform deep research on the given topic and provide a response that will explain the topic in depth and provide insights and analysis on the topic. use the Following Content for Better Understanding of the Topic : {context}"),
            HumanMessage(content=str(task))
        ]
    else:
        messages = [
            SystemMessage(content="You are a Professional Research Analyst, Your task is to perform deep research on the given topic and provide a response that will explain the topic in depth and provide insights and analysis on the topic."),
            HumanMessage(content=str(task))
        ]
    result = llm_gemini.invoke(messages)
    return {"worker_outputs": {state["currentKey"]: result.content}}

def route_to_workers(state: dict):
    return [
        Send("WorkerNode", {"currentKey": key, "currentTask": task})
        for key, task in state["DistributedWork"].items()
    ]

# Final Node
def finalNode(state: dict):
    combinedReport = "\n\n".join(
        f"{'='*80}\n{key}\n{'='*80}\n{content}" for key, content in state["worker_outputs"].items()
    )
    return {"worker_outputs": {"FINAL_COMBINED": combinedReport}}

# Graph Construction
graph_builder = StateGraph(State)
graph_builder.add_node("StartNode", StartNode)
graph_builder.add_node("DividerNode", DividerNode)
graph_builder.add_node("WorkerNode", WorkerNode)
graph_builder.add_node("finalNode", finalNode)

graph_builder.add_edge(START, "StartNode")
graph_builder.add_edge("StartNode", "DividerNode")
graph_builder.add_conditional_edges("DividerNode", route_to_workers)
graph_builder.add_edge("WorkerNode", "finalNode")
graph_builder.add_edge("finalNode", END)

graph = graph_builder.compile()

@mcp.tool()
def run_deep_research(query: str, workerNodes: int = 2, useDocument: str = "no") -> str:
    """
    Run the langgraph multi-node deep research process.
    """
    if useDocument.lower() == "yes":
        docker_command = "docker compose -f docker-compose.yml up -d"
        subprocess.run(docker_command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        import sys
        subprocess.run([sys.executable, "documentLoader.py"], capture_output=True, text=True, check=True)
    
    initial_state = {
        "Query": query,
        "HeadNodes": [],
        "DistributedWork": {},
        "workerNodes": workerNodes,
        "useDocument": useDocument,
        "worker_outputs": {}
    }
    
    ans = graph.invoke(initial_state)
    combined = ans["worker_outputs"].get("FINAL_COMBINED", "No result generated.")
    
    return f"===== FINAL RESEARCH REPORT =====\nQuery: {query}\nWorkers: {workerNodes}\nTime: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n{combined}"

if __name__ == "__main__":
    mcp.run()