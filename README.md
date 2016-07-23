# Cachet-healthcheck
A simple health check service to be used with Cachet

Cachet (https://github.com/CachetHQ/Cachet) is a very nice status page with a good clean interface and easy to setup but it is missing some healthcheck to automatically change the status if a site goes down

This is a simple node script that once a minute checks the sites listed in the Config.json file. I can check a simple port like IRC or with websites a simple check of the title to see if the site is up or not

After 5 mins a incident report is automatically generateded 

###TODO
convert to php/laravel so that it could be integrated directly into the project
