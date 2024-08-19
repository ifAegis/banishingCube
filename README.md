# Welcome to banishingCube

banishingCube is a set of codes designed to automatically remove repeated Youtube recommendations from your home page.

Once you watch a video, click the cube, and it's banished. 

This script was created after I repeatedly had videos I already watched getting shoved into my home page, much to my annoyance.

I also believe it could be very useful for keeping track of what you've watched without letting Google do the same.


## What you need:

1. [Firefox Browser](https://www.mozilla.org/en-US/firefox/new/)
2. [Cloudflare](https://dash.cloudflare.com/sign-up?pt=f), with Workers and R2 Bucket enabled
3. [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
4. [UBlock Origin](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/)
5. [Node.js](https://nodejs.org/en/download/package-manager)

## Tampermonkey
After installing Tampermonkey, go to the dashboard and create a new script

Clear any existing lines from the file, and copy and paste the contents of main.js

Save under File, or with Ctrl+S

### You will need to come back to this later after setting up Workers, do not close the dashboard

Skip to the Cloudflare section for now

After setting up your Cloudflare workers, add your workerWriter's url to the variable "workerURL"

Save under File, or with Ctrl + S

I would recommend not closing the dashboard, as you may want to modify the positioning of the Cube

Go back to where you were to continue

## Cloudflare

After creating your account, go to the left side and click R2. Enable this, it's completely free

Follow the instructions Cloudflare provides to install Wrangler and create your bucket

Go to your bucket settings, scroll down and edit the CORS policy

Replace the existing lines with the following:
```
[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "POST"
    ],
    "AllowedHeaders": [
      "Content-Type"
    ]
  }
]
```
Be sure to save!

With your bucket now created, go to the left side and click on "Workers & Pages"

Create your first worker, workerWriter. 

Go to Settings, then Variables, and scroll down to add an R2 Bucket binding

Use the variable name R2_BUCKET, and bind the bucket you just created

Edit the code of your worker.

Copy and Paste the code from workerWriter.js into your worker, and click "Deploy" on the right side

Copy the url to workerWriter (nearby the Deploy button), go back and finish the Tampermonkey section from earlier, then return here to continue

Create your second worker, workerLister

Add an R2 Bucket binding

Again use the variable name R2_BUCKET, and bind the same bucket as you used for workerWriter

Copy and Paste the code from workerLister.js into your worker, and click "Deploy" on the right side

Copy the url to workerLister, and continue to the Ublock Origin section 

## Ublock Origin

Open the dashboard for Ublock Origin

Scroll to the bottom of the "Filter Lists" page

Click on "Import", and enter the URL of your workerLister Worker

Ublock Origin will automatically update your list every 6 hours

### Thank you for using my code and I hope it serves you well
