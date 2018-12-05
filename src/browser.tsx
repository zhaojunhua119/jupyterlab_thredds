import * as React from 'react';

import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

import { Injector } from './injector';
import { IDataset, ThreddsDataset } from './listing';

export interface IProps {
    open(dataset: IDataset, openas: string): void;
}

export interface IState {
    catalog_url: string;
    openas: string;
    datasets: IDataset[];
    busy: boolean;
    error: string;
}

export class ThreddsCatalogBrowser extends React.Component<IProps, IState> {
    injector: Injector;
    private serverSettings: ServerConnection.ISettings;

    constructor(props: IProps) {
        super(props);
        this.serverSettings = ServerConnection.makeSettings();
        this.injector = new Injector();
        this.state = {
            busy: false,
            catalog_url: 'http://localhost:8080/thredds/catalog.xml',
            datasets: [],
            error: '',
            openas: this.injector.default,
        };
    }

    handleSubmit = (event: any) => {
        this.fetchDatasets(this.state.catalog_url);
        event.preventDefault();
    }

    fetchDatasets(catalogUrl: string) {
        const query = { catalog_url: this.state.catalog_url };
        const url = URLExt.join(this.serverSettings.baseUrl, 'thredds') + URLExt.objectToQueryString(query);
        this.setState({
            busy: true,
            datasets: [],
            error: '',
        });
        ServerConnection.makeRequest(url, {}, this.serverSettings).then(async (response) => {
            const data = await response.json();
            if (response.ok) {
                this.setState({
                    busy: false,
                    datasets: data,
                });
            } else {
                this.setState({
                    busy: false,
                    error: data.title,
                });
            }
        }).catch((reason) => {
            this.setState({
                busy: false,
                error: reason,
            });
        });
    }

    onCatalogUrlChange = (event: any) => {
        this.setState({ catalog_url: event.target.value });
    }

    onOpenAsChange = (event: any) => {
        this.setState({ openas: event.target.value });
    }

    onDatasetClick = (dataset: IDataset) => {
        this.props.open(dataset, this.state.openas);
    }

    render() {
        const datasets = this.state.datasets.map((d) => (
            <ThreddsDataset key={d.id} dataset={d} onClick={this.onDatasetClick} disabled={!this.injector.supportedDataset(d, this.state.openas)}/>
        ));
        const injectors = this.injector.injectors.map((c) => (
            <option value={c.id}>{c.label}</option>
        ));
        return (
            <div>
                <form className="p-Widget" onSubmit={this.handleSubmit}>
                    <div className="p-Widget">
                        <label>THREDDS Catalog URL</label>
                        <div className="jp-TreddsBrowser-wrapper">
                            <input disabled={this.state.busy} className="jp-mod-styled jp-TreddsBrowser-input" type="text" value={this.state.catalog_url} onChange={this.onCatalogUrlChange} />
                        </div>
                    </div>
                    <div className="p-Widget">
                        <label>
                            Open as
                        </label>
                        <div className="jp-select-wrapper">
                            <select className="jp-mod-styled" value={this.state.openas} onChange={this.onOpenAsChange}>
                                {injectors}
                            </select>
                        </div>
                    </div>
                    <div className="p-Widget jp-TreddsBrowser-wrapper">
                        <input className="jp-mod-styled jp-TreddsBrowser-input" type="submit" value="Fetch datasets" />
                    </div>
                </form>
                <hr />
                {this.state.busy && <span className="jp-ThreddsBrowser-busy">Crawling catalog, please wait</span>}
                {this.state.error && <span className="jp-ThreddsBrowser-fetcherror">Error: {this.state.error}</span>}
                <div className="p-Widget jp-DirListing">
                    <ul className="jp-DirListing-content">
                        {datasets}
                    </ul>
                </div>
            </div>
        );
    }
}
