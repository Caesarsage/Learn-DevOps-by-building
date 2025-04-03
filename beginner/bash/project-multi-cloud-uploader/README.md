# multi-cloud-file-uploader

# Cloud Setup Script

This script is designed to assist with setting up cloud resources across different providers and uploading files to their diff file storages. Currently, it supports Azure, AWS, and GCP. Below is a brief overview of the script and its functionalities.

## Prerequisites
- The script assumes you have the necessary credentials and permissions to create resources on the selected cloud providers.
- It is recommended to run this script on a Linux environment with Bash.

## Usage
1. Make the script executable:
    ```bash
    chmod +x main
    ```
2. Run the script:
    ```bash
    ./main
    ```
3. Follow the prompts to choose the cloud provider and the specific action you want to perform.

## Functions

### 1. Azure Setup
- `az_start`: Initiates the Azure setup process, creating a resource group, storage account, container, and file share.

### 2. AWS Setup
- `setup_aws`: Installs the AWS CLI and configures it with your credentials.

### 3. GCP Setup
- `setup_gcp`: Installs the Google Cloud SDK (gcloud) and authenticates with your GCP account.

### 4. Destroy Resources
- `az_destroy_resource_group`: Destroys Azure resources created by the script.

### Menus
- `start_menu`: Displays the main menu with options to create a new upload, destroy upload resources, or exit.
- `print_menu`: Displays the menu for selecting the cloud provider.
  
## Note and Contributions

- Feel free to raise a PR to contribute and enhance the script based on your use cloud case. 

- If you encounter issues or have suggestions, open an issue on the repository.
