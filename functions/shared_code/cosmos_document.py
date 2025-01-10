# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.

""" Library of code for status logs reused across various calling features """
import base64
import logging
import os
from azure.cosmos import CosmosClient, PartitionKey, exceptions

class CosmosDocument:
    """ Class for logging status of various processes to Cosmos DB"""

    def __init__(self, url, azure_credential, database_name, container_name):
        """ Constructor function """
        self._url = url
        self.azure_credential = azure_credential
        self._database_name = database_name
        self._container_name = container_name
        self.cosmos_client = CosmosClient(url=self._url, credential=self.azure_credential, consistency_level='Session')
        self._log_document = {}

        # Select a database (will create it if it doesn't exist)
        self.database = self.cosmos_client.get_database_client(self._database_name)
        if self._database_name not in [db['id'] for db in self.cosmos_client.list_databases()]:
            self.database = self.cosmos_client.create_database(self._database_name)

        # Select a container (will create it if it doesn't exist)
        self.container = self.database.get_container_client(self._container_name)
        if self._container_name not in [container['id'] for container
                                        in self.database.list_containers()]:
            self.container = self.database.create_container(id=self._container_name,
                partition_key=PartitionKey(path="/file_name"))

    def encode_document_id(self, document_id):
        """ encode a path/file name to remove unsafe chars for a cosmos db id """
        safe_id = base64.urlsafe_b64encode(document_id.encode()).decode()
        return safe_id

    def upsert_document(self, document_path, document):
        """ Function to upsert a status item for a specified id """
        try:
            document_id = self.encode_document_id(document_path)
            document["id"] = document_id
            document["file_name"] = document_path
            self.container.upsert_item(body=document)
        except Exception as err:
            # log the exception with stack trace to the status log
            logging.error("Unexpected exception upserting document %s", str(err))


    def get_document(self, document_path:str):
        """Saves the document in the storage"""
        try:
            doc_id = self.encode_document_id(document_path)
            return self.container.read_item(item=doc_id, partition_key=document_path)
        except exceptions.CosmosResourceNotFoundError:
            return None

    def delete_document(self, document_path: str) -> None:
        '''Deletes doc for a file paths'''
        doc_id = self.encode_document_id(document_path)
        logging.debug("deleting tags item for doc %s \n \t with ID %s", document_path, doc_id)
        try:
            self.container.delete_item(item=doc_id, partition_key=document_path)
            logging.info("deleted tags for document path %s", document_path)
        except exceptions.CosmosResourceNotFoundError:
            logging.info("Tag entry for %s already deleted", document_path)