#!/usr/bin/python

import json
import importlib
import logging
import os
import re
import signal
import subprocess
import pathlib
import traceback

from mc_includes.KlippyWebsocket import KlippyWebsocket
from mc_includes.KlippyRest import KlippyRest

logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger('matplotlib').setLevel(logging.WARNING)

# This is here to avoid performance issues opening bed_mesh
import matplotlib.pyplot  # noqa

class MoonCord:
    def __init__(self):
        return

    def connectPrinter(self):
        self.apiclient = KlippyRest()

