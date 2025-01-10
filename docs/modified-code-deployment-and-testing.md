# Application Deployment and Setup Documentation

## Introduction
This document provides detailed instructions for sharing the code, setting up the local environment, deploying and testing the application flow. 

## Share Source Code

- Cleanup the environment variables and any other sensitive information files.
- Archive the latest code.
- Upload to the accessible shared location.

## Deployment

Please follow the steps carefully to ensure the application is deployed and functioning properly.

### Local Environment Setup

- Download the source code from shared location.
- Copy the source code to WSL machine.
- Extract the source code zip
- Follow the instructions to open the code in dev container.

#### Open Code in Development Container
The next step is to open the source code and build the dev container. To do this you will:

- Log into Azure using the Azure CLI
- Open the extracted source code into VSCode
- Launch and connect to the development container from VSCode
#### Important: Rebuild Development container

A new popup should appear in VS Code to rebuild the container. If the popup does not appear you can also do the following:

- Control + Shift + P
- Type Rebuild and select "Dev Containers: Rebuild Container"

### Deploy Infrastructure and Application

- Follow the instructions from [https://github.com/microsoft/PubSec-Info-Assistant/blob/main/docs/deployment/deployment.md](https://github.com/microsoft/PubSec-Info-Assistant/blob/main/docs/deployment/deployment.md) to deploy the application.

### Testing

Follow the below steps to ingest the documents and test the chat bot.

#### Step 1: Setup the documents metadata

- Create new **CSV** file with all the valid metadata. Metadata file must contain the columns, **filename, key, value**.
- Make sure you have **Year, and Citation** metadata for content filtering and citation reference from UI.
- Upload the metadata CSV file into the **metadata** container in Azure Blob Storage.

#### Step 2: Upload documents

- Create new directory in the **upload** container in Azure Blob Stroage and upload the documents into that directory.
- Make sure your directory and filename(path) matches with metadata file. Otherwise metadata will not be mapped.

#### Step 3: Verify documents ingested

- Navigate to the **Manage Content** page from the UI.
- Apply the filters and verify that document ingestion is completed.

### Step 4: Test the chat

- Navigate to the **Chat** page and run the test queries.
