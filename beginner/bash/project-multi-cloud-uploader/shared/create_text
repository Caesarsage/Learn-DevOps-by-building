#!/bin/bash

create_file() {
  echo "==================== CREATE FILE OR USE EXISTING FILE PATH =============================="
  read -p "Do you want to create a new file? (y/n): " create_file

  if [[ $create_file == "y" || $create_file = "Y" || $create_file = "Yes" || $create_file = "YES" ]]; then
    echo "Enter file name: "
    read file_name
    echo "Enter file content: "
    read file_content 
    echo $file_content > uploads/$file_name

    file_path = "uploads/$file_name"
    echo "======================================================="
  else
    echo "Enter file name: "
    read file_name
    echo
    echo "Enter file path: "
    read file_path
    echo "======================================================="
  fi
}
