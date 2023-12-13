import os
import time

while True:
    os.system("python3 main.py")
    os.system("aws s3 cp bab-votes.json s3://s3.vestige.fi/bab-votes.json --acl public-read")
    time.sleep(60)