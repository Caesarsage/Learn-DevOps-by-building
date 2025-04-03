# LAMP STACK IMPLEMENTATION

- L - Linux
- A - Apache
- M - MySQL
- P - PHP

## Documentation

We will be using Ubuntu Virtual Machine through AZURE.

![Ubuntu VM](./images/vm.png)

After creating the VM, Login and we will be using the following commands to update the VM

```bash
sudo apt update
sudo apt upgrade
```

### Installing Apache

Apache is a simple web server that is very popular. It is often used to serve PHP applications, but it can also serve static HTML content.

Then we will be installing the following packages

```bash
sudo apt install apache2
```

* The apache2 package installs Apache 2.4 and the default configuration is to run Apache as a daemon. Once the apache2 package finishes installing, you can go to your server’s IP address in your browser and see the default Apache landing page.

![apache2 default page](./images/apache-homepage.png)

Then check the status of the apache2 service

```bash
sudo systemctl status apache2
```

![apache2 status](./images/apache-status.png)

This will show you the status of the apache2 service. If it is not running, you can start it with this command:

```bash
sudo systemctl start apache2
```
You could also use `curl` to check if the apache2 service is running

```bash
curl http://localhost:80
```

This display the apache2 default page in the terminal as text.

### Installing MySQL DB

To install MySQL, run the following command:

```bash
sudo apt install mysql-server -y
```

Then login to MySQL with the following command:

```bash
sudo mysql
```

Create a new user and grant privileges to the user

```bash
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'admin'@'localhost' WITH GRANT OPTION;
```

Check if the user is created

```bash
SELECT user FROM mysql.user;
```

![mysql user](./images/user-admni.png)

Then exit MySQL with the following command:

```bash
exit
```

To start the MySQL interactive shell with the following command:

```bash
sudo mysql -u admin -p
```

Enter the password you created for the admin user. You should now be in the MySQL shell.

To exit the MySQL shell, run the following command:

```bash
exit
```

### Installing PHP

Php is a server-side scripting language designed for web development but also used as a general-purpose programming language.

To install PHP, run the following command:

```bash
sudo apt install php libapache2-mod-php php-mysql -y
```
These packages tell Ubuntu that you want to install PHP, the Apache PHP module, and MySQL support for PHP. Also, the -y flag is used to skip the confirmation prompt.

**NB**: To stop using sudo, you can add your user to the www-data group. This will allow you to run commands as the www-data user without using sudo.

Check if the php is installed

```bash
php -v
```
![php version](./images/php.png)

If you got here with no errors, you have successfully installed 
- Apache, 
- MySQL, and 
- PHP on your Ubuntu server.

### Testing PHP

Now we will be creating a simple PHP file to test if the PHP is working.

Create a new directory in the /var/www directory

```bash
sudo mkdir /var/www/projectlamp
```

Then assign ownership of the directory with current system user. This is to avoid permission issues.


```bash
sudo chown -R $USER:$USER /var/www/projectlamp
```

This makes the current user the owner of the directory and the group owner as well.

Then create and open a new configuration file in the /etc/apache2/sites-available directory

```bash
sudo nano /etc/apache2/sites-available/projectlamp.conf
```

Then add the following lines to the file:

```bash
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    ServerName projectlamp
    ServerAlias www.projectlamp
    DocumentRoot /var/www/projectlamp
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```
This configuration file tells Apache to serve the /var/www/projectlamp directory when someone visits projectlamp in their browser.

You can use any name you want for the ServerName and ServerAlias directives. The ServerAlias directive is optional, but it is useful if you want to use a domain name instead of an IP address to access your site.

- Verify available sites

```bash
 000-default.conf  default-ssl.conf  projectlamp.conf
```

![available sites](./images/available-sites.png)

Then enable the new configuration file with the following command:

```bash
sudo a2ensite projectlamp.conf
```

![enable site](./images/activate-conf.png)

Then disable the default configuration file with the following command to avoid conflict:

```bash
sudo a2dissite 000-default.conf
```

Then reload Apache with the following command:

```bash
sudo systemctl reload apache2
```

Then create a new index.php file in the /var/www/projectlamp directory

```bash
sudo nano /var/www/projectlamp/index.php
```

Then add the following lines to the file:

```bash
<?php
phpinfo();
?>
```

This file will display information about your PHP installation when you visit projectlamp in your browser through public dns or ip address.

### Enable PHP in Apache

The default configuration for Apache does not allow PHP files to be executed. To enable PHP, you need to edit the /etc/apache2/mods-enabled/dir.conf file.

```bash
sudo nano /etc/apache2/mods-enabled/dir.conf
```

Then change the following line:

```bash
<IfModule mod_dir.c>
    DirectoryIndex index.html index.cgi index.pl index.php index.xhtml index.htm
</IfModule>
```
TO
  
  ```bash
<IfModule mod_dir.c>
    DirectoryIndex index.php index.html index.cgi index.pl index.xhtml index.htm
</IfModule>
```

Then reload Apache with the following command:

```bash
sudo systemctl reload apache2
```

Then open your browser and visit projectlamp through public dns or ip address. You should see the PHP information page.

![php info](./images/php-info.png)

Congratulations! You have successfully installed Apache, MySQL, and PHP on your Ubuntu server.

It is best to remove the php file as it may contain sensitive information.

```bash
sudo rm /var/www/projectlamp/index.php
```

# Destroy Azure VM

To destroy the VM, go to the Azure portal and delete the resource group.

Explore from here !!!


[Project 2: LEMP STACK](../project-02/README.md/)
