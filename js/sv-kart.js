const apiUrl = "https://cors-anywhere.herokuapp.com/https://valgresultat.no/api/";

const partiKode = "SV";

const year = '2013';

const opptalt = "";
const oppslutning = [];


const map = L.map('map', {
    center: [63.5, 10],
    zoom: 7
});


function lastOppslutning() {
    let fylke = $("#FylkesVelger option:selected").val();
    let url = apiUrl + year + "/st/" + fylke;


    fetch(url).then(r => r.json())
        .then(function (json) {
            let promises = [];
            let links = json._links.related;
            console.log(links);
            for (let kommuneUrl of links) {
                let url = apiUrl + kommuneUrl.href;
                promises.push(
                fetch(url).then(r => r.json())
                    .then(function (json) {
                        let kommuneRes = getOppslutning(json);
                        oppslutning[kommuneUrl.nr] = kommuneRes;
                    }));
            }
            Promise.all(promises).then(function() {
                console.log(oppslutning);
                loadKommuneMap();
            });
        });
}

function getOppslutning(json) {
    let parti = json.partier.filter(function (data) {
        return (data.id.partikode === partiKode);
    });
    return parti[0].stemmer;
}


function getResultat(kommuneNr) {
    /*let fylke = $("#FylkesVelger option:selected").val();
    const url = apiUrl + year + "/st/" + fylke + "/" + kommuneNr;
    fetch(url).then(r => r.json())
        .then(function (json) {
            return getOppslutning(json);
        });*/

}

lastOppslutning();
//console.log(oppslutning);

function loadKommuneMap() {
    let fylke = $("#FylkesVelger option:selected").val();
    fetch("kommuner.geojson").then(r => r.json())
        .then(function (json) {
            const grenser = json;
            const grenseLayer = L.geoJson(grenser, {
                style: style,
                onEachFeature: onEachFeature,
                filter: function (featureData) {
                    let featureFylke = featureData.properties.KOMM.toString().substring(0, 2);
                    return featureFylke === fylke;
                }
            }).addTo(map);

        });
}

function style(feature) {
    let res = oppslutning[feature.properties.KOMM];
    console.log(res);
    const color = getColor(res.resultat.prosent);
    return {
        fillColor: color,
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}


function zoomTilKommune(e) {
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomTilKommune
    });
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 2,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    });
    info.update();
}


let info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

info.update = function (props) {
    if (props == undefined) {
        this._div.innerHTML = "";
        return;
    }
    let res = oppslutning[props.KOMM];
    let kommuneInfo ='Oppslutning: ' + res.resultat.prosent + ' %<br /> Navn: ' + props.NAVN+'<br />Antall SV-stemmer: '+res.resultat.antall.total;
    kommuneInfo+='<br/>Endring siden ('+(year-2)+'): '+res.resultat.endring.ekvivalent+' %-poeng<br/>Endring ('+(year-4)+'): '+res.resultat.endring.samme+' %-poeng';
    this._div.innerHTML = kommuneInfo;
};


info.addTo(map);


function getColor(p) {
    return p > 6.5 ? '#FF0000' :
        p > 5.0 ? '#FF3333' :
            p > 3.5 ? '#FF7777' :
                p > 2.0 ? '#FF9999' :
                    p > 0 ? '	#FFCCCC' :
                        '#000000';
}


/*
function hentFraAPI() {

    $('#loading').show();
    const apiUrl = "https://cors-anywhere.herokuapp.com/https://valgresultat.no/api" + $("#FylkesVelger option:selected").val();

    fetch(apiUrl).then(r = > r.json()
)
.
    then(data = > oppdaterData(data)
)
}*/