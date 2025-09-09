export interface optionSearch {
    id: number;
    layerName: string,
    source: string,
    colNamesToReturn: string[],
    placeholder: string,
    getCQLFilter: Function
}

export interface objCompiled {
    cqlFilter: string,
    colName: string,
    wordTranslated: string;
}

export class SearchConfig {

    constructor() { }

    public optionsToSearch: optionSearch[] = [
        {
            id: 8,
            layerName: 'Imóveis',
            source: 'pmspwebgeo:imoveis',
            colNamesToReturn: ['gid_imovel', 'cod_imovel', 'ic_imovel', 'dominialid', 'tributacao', 'loteamento', 'lote', 'quadra', 'logradouro', 'num', 'compleme'],
            placeholder: 'Cód. reduzido ou inscrição cadastral',
            getCQLFilter: (e: string): objCompiled => { return this.getCQLFilterImoveis(e) }
        },
        {
            id: 19,
            layerName: 'Vias',
            source: 'pmspwebgeo:vias_geom_geoserver',
            colNamesToReturn: ['gid','tipo','nome','classe'],
            placeholder: 'Nome do logradouro (sem número)',
            getCQLFilter: (e: string): objCompiled => { return this.getCQLFilterVias(e) }
        },
        {
            id: 172,
            layerName: 'Alertas',
            source: 'pmspwebgeo:monitorAreasPublicas_pontos',
            colNamesToReturn: ['gid'],
            placeholder: 'Buscar alerta',
            getCQLFilter: (e: string): objCompiled => { return { cqlFilter: "gid = " + e , colName: 'gid', wordTranslated: e } }
        }
        ,
        {
            id: 170,
            layerName: 'Ordem de serviço',
            source: 'pmspwebgeo:zeladoria_pontos_final',
            colNamesToReturn: ['id_ordemservico'],
            placeholder: 'Buscar ordem de serviço',
            getCQLFilter: (e: string): objCompiled => { return { cqlFilter: "id_ordemservico_text LIKE '" + e + "'" , colName: 'id_ordemservico', wordTranslated: e } }
        }
    ]

    getCQLFilterImoveis(searchWord: string): objCompiled {
        var colName: string
        let isnum = /^\d+$/.test(searchWord);

        if (searchWord.length <= 6) {
            colName = 'cod_imovel';
        }
        else {
            colName = 'ic_imovel';
        }

        if (!isnum) {
            var cql = '1=2' // Forçar o retorno sem feições provocado pelo CQL Filter
        }
        else {
            var cql = colName + " LIKE '" + searchWord + encodeURIComponent("%'")
        }
        return { cqlFilter: cql, colName: colName, wordTranslated: searchWord };
    }

    getCQLFilterVias(searchWord: string): objCompiled {
        var word = searchWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        var wordsList = this.tratarBuscaLogradouro(word);
        word = wordsList.length === 1 ? wordsList[0] : wordsList[1];

        var col = 'nome'

        var cql = 'strStripAccents(strToLowerCase(' + col + ')) LIKE ' + encodeURIComponent("'%") + word + encodeURIComponent("%'");

        return { cqlFilter: cql, colName: col, wordTranslated: word }
    }

    tratarBuscaLogradouro(str: string) {
        var strNew = str.split(' ');

        var values = ['rua', 'av', 'avenida', 'alameda', 'al', 'via', 'est', 'estrada', 'viela', 'ponte', 'pça', 'praça', 'lgo', 'largo', 'calçada', 'calc']
        if (strNew.length > 1 && values.includes(strNew[0].replaceAll('.', '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) {
            return [strNew[0], strNew.slice(1,).join(' ')];
        }
        else return [str]
    }
}