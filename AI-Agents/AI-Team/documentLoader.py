from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from dotenv import load_dotenv

load_dotenv()

pdf_folder = Path(__file__).parent / "Place-Documents-Here"

# Load all PDF files from the directory
docs = []
for pdf_file in pdf_folder.glob("*.pdf"):
    loader = PyPDFLoader(file_path=str(pdf_file))
    docs.extend(loader.load())

text_splitters = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=400
)

chunks = text_splitters.split_documents(documents=docs)

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

vector_db = QdrantVectorStore.from_documents(
    documents=chunks,
    embedding=embeddings,
    url="http://localhost:6333",
    collection_name="DocumentsforAI"
)

print("Vector Store Created Successfully")