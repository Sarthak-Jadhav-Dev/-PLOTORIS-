from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from dotenv import load_dotenv

load_dotenv()

def Preparing_Vector_DB():
    loader = DirectoryLoader(
    "./Cloned-Repository/Project-Inside",
    glob="**/*.py",
    loader_cls=TextLoader
    )
    code = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    docs = text_splitter.split_documents(code)
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    vector_db = QdrantVectorStore.from_documents(
        documents=docs,
        embedding=embeddings,
        url = "http://localhost:6333",
        collection_name="GitHub Repo Collection"
    )
    print("Vector Store Created Successfully")
    return vector_db
