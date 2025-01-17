from collections import defaultdict
import csv
from io import StringIO
import logging
import os
import random
import time

from shared_code.helper import sanitize_to_csharp_identifier
from shared_code.cosmos_document import CosmosDocument
import azure.functions as func
from azure.identity import ManagedIdentityCredential, AzureAuthorityHosts, DefaultAzureCredential


cosmosdb_url = os.environ["COSMOSDB_URL"]
cosmosdb_metadata_database_name = os.environ["COSMOSDB_METADATA_DATABASE_NAME"]
cosmosdb_metadata_container_name = os.environ["COSMOSDB_METADATA_CONTAINER_NAME"]
local_debug = os.environ["LOCAL_DEBUG"]
azure_authority_host = os.environ["AZURE_OPENAI_AUTHORITY_HOST"]

if azure_authority_host == "AzureUSGovernment":
    AUTHORITY = AzureAuthorityHosts.AZURE_GOVERNMENT
else:
    AUTHORITY = AzureAuthorityHosts.AZURE_PUBLIC_CLOUD

# When debugging in VSCode, use the current user identity to authenticate with Azure OpenAI,
# Cognitive Search and Blob Storage (no secrets needed, just use 'az login' locally)
# Use managed identity when deployed on Azure.
# If you encounter a blocking error during a DefaultAzureCredntial resolution, you can exclude
# the problematic credential by using a parameter (ex. exclude_shared_token_cache_credential=True)
if local_debug == "true":
    azure_credential = DefaultAzureCredential(authority=AUTHORITY)
else:
    azure_credential = ManagedIdentityCredential(authority=AUTHORITY)


function_name = "MetadataLoadFunc"

cosmos_metadata = CosmosDocument(cosmosdb_url, azure_credential,
                                 cosmosdb_metadata_database_name, cosmosdb_metadata_container_name)


def get_metadata_and_upload_to_cosmos(grouped_data):
    for key, value in grouped_data.items():
        # if value.get('citation', None) and value.get('title', None):
        #     value['citation'] = value['citation'].replace(
        #         value['title'], f"_**{value['title']}**_")
        cosmos_metadata.upsert_document(key, value)


def main(myblob: func.InputStream):
    """ Function to read supported file types and pass to the correct queue for processing"""

    try:
        time.sleep(random.randint(1, 2))  # add a random delay

        file_extension = os.path.splitext(myblob.name)[1][1:].lower()

        if file_extension == 'csv':
            content = myblob.read().decode('utf-8')

            # Use StringIO to treat the content as a file-like object
            csv_file = StringIO(content)

            # Initialize a defaultdict to store data grouped by filename
            grouped_data = defaultdict(dict)

            # Read the CSV file
            reader = csv.reader(csv_file)

            # Skip header if necessary (assuming the first row is a header)
            next(reader)  # Comment out if no header is present

            # Process each row in the CSV
            for row in reader:
                if len(row) == 3:  # Ensure the row has three columns (filename, key, value)
                    filename, key, value = row
                    # Group data by filename and store key-value pairs in a dictionary
                    grouped_data[filename][sanitize_to_csharp_identifier(
                        key)] = value
                else:
                    logging.warning(f"Skipping invalid row: {row}")

            get_metadata_and_upload_to_cosmos(grouped_data)
        else:
            logging.warning(
                f"Invalid metadata file found. File path: {myblob.name}")

    except Exception as err:
        logging.error(f"{function_name} - An error occurred - {str(err)}")
