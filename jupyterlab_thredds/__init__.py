import re, json

import tornado.gen as gen
from tornado.httputil import url_concat
from tornado.httpclient import AsyncHTTPClient, HTTPRequest, HTTPError

from traitlets import Integer
from traitlets.config import Configurable

from notebook.utils import url_path_join, url_escape
from notebook.base.handlers import APIHandler

from thredds_crawler.crawl import Crawl

__version__ = '0.1.0'


class ThreddsConfig(Configurable):
    """
    Configuration of Threddds catalog crawler

    """
    workers = Integer(4, config=True, help='Number of workers to use for crawling')


def flatten_dataset(dataset):
    return {
        'id': dataset.id,
        'name': dataset.name,
        'catalog_url': dataset.catalog_url,
        'services': dataset.services,
        'data_size': dataset.data_size,
    }


class ThreddsHandler(APIHandler):
    """
    A thredds catalog crawler

    TODO add select, skip and modified time filters

    """

    def data_received(self, chunk):
        pass

    @gen.coroutine
    def get(self, catalog_url=''):
        c = ThreddsConfig(config=self.config)
        crawl = Crawl(catalog_url, workers=c.workers)

        datasets = [flatten_dataset(d) for d in crawl.datasets]
        self.finish(datasets)



def _jupyter_server_extension_paths():
    return [{
        'module': 'jupyterlab_thredds'
    }]


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.
    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    base_url = web_app.settings['base_url']
    endpoint = url_path_join(base_url, 'thredds')
    handlers = [(endpoint + "(.*)", ThreddsHandler)]
    web_app.add_handlers('.*$', handlers)
