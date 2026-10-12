import sys
from gradio_client import Client
for s in sys.argv[1:]:
    print("#######", s)
    try:
        c = Client(s, verbose=False)
        c.view_api()
    except Exception as e:
        print("ERREUR", repr(e)[:300])
