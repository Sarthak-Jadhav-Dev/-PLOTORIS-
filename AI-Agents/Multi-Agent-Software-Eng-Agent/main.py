from dotenv import load_dotenv
from git import Repo
from langchain_core.messages import HumanMessage,AIMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from typing_extensions import TypedDict,Annotated
from Services.VectorDB import Preparing_Vector_DB
import os

load_dotenv()

repo_link = input("Please Enter the Github Repository Link to Monitor: ")

def clone_github_repo(repo_url, local_dir):
    try:
        if os.path.isdir(local_dir):
            print(f"Directory '{local_dir}' already exists. Pulling latest changes.")
            repo = Repo(local_dir)
            origin = repo.remotes.origin
            origin.pull()
        else:
            print(f"Cloning {repo_url} into {local_dir}...")
            Repo.clone_from(repo_url, local_dir)
            print("Cloning successful.")
            print(f"The Repository is Clonned in {local_dir}")
    except Exception as e:
        print(f"An error occurred: {e}")
 
destination_folder = "./Cloned-Repository/Project-Inside"

clone_github_repo(repo_link, destination_folder)

vector_db = Preparing_Vector_DB()

if(vector_db):
    print("Code is Loaded and Vector DB is Created Successfully")
else:
    print("Error in Loading Code and Creating Vector DB")