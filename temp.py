from qdrant_client import QdrantClient
from qdrant_client.models import Document
QDRANT_API_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6MmRiZjM5NzktOGJlMS00ZTBlLTg1MjktOWMyYWM0NWRlZTc0In0.FkppVArxpTdydE9v11xLvtDtRf6I9Jgy_tIAa7O1h2I'
QDRANT_URL='https://4a14b291-98d0-46bf-9e91-661036642f68.us-west-1-0.aws.cloud.qdrant.io'
from qdrant_client import QdrantClient
from qdrant_client.models import Document

from qdrant_client import QdrantClient
from qdrant_client.models import Document

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    cloud_inference=True
)

results = client.query_points(
    collection_name="research_papers",
    query=Document(
        text="What is machine learning?",
        model="intfloat/multilingual-e5-small"
    ),
    limit=3
)

print(results)