//app state container
var app = {},svg,tooltip,buurten,currentlayer,currentdotid,searchdata = [],xAxisLabel,yAxisLabel,height,width,margin;

height = parseInt(window.getComputedStyle(document.querySelector('#mapcontainer')).height, 10)-55;
width = parseInt(window.getComputedStyle(document.querySelector('#chartcontainer')).width, 10);

margin = {top: 20, right: 20, bottom: 50, left: 70};
width = width - margin.left - margin.right;
height = height - margin.top - margin.bottom;

/*HELPER FUNCTIONS*/
// Create a new date from a string, return as a timestamp.
function timestamp(str){
    return new Date(str).getTime();
}
var getObj = function(set, obj, key){
    for (var i = 0; i<set.length; i++){
        if (set[i][key] == obj){
            return set[i];
            break;
        }
    }
};

var getKey = function(set, obj, key, val){
    for (var i = 0; i<set.length; i++){
        if (set[i][key] == obj.id){
            return set[i][key];
            break;
        }
    }
};
var getJson = function(url) {
    var promise = new Promise(function(resolve, reject) {
        var client = new XMLHttpRequest();
        client.open("GET", url);
        client.onreadystatechange = handler;
        client.responseType = "json";
        client.setRequestHeader("Accept", "application/json");
        client.send();

        function handler() {
            if (this.readyState === this.DONE) {
                if (this.status === 200) { resolve(this.response); }
                else { reject(this); }
            }
        };
    });
    return promise;
}
var formatDateAsYMD = function(date){
    //return (new Date(date).toISOString().substring(0,10))
    return $.datepicker.formatDate('yy-mm-dd', new Date(+date))
}

var formatUTCDateAsYMD = function(date) {
    return $.datepicker.formatDate('yy-mm-dd', new Date(date))
}

// Create a string representation of the date.
function formatDate ( date ) {
    return weekdays[date.getDay()] + ", " +
        date.getDate() + " " +
        months[date.getMonth()] + " " +
        date.getFullYear();
}
//find a buurt and call highlight functions
var findBuurt = function(val) {
    var buurt = getObj(searchdata, val, 'name');
    d3.selectAll("circle")
        .classed("circleLight", function(d) {
            if (d.bu_code == buurt.code) {
                return true;
            } else {
                return false;
            }
        });
    processSelect(buurt.code)
}
/*Styling functions*/
var showNoDataInfo = function() {
    $('#no-data-info').addClass('visible');
}
var hideNoDataInfo = function() {
    $('#no-data-info').removeClass('visible');
}
//passing a variable is at least a TINY bit of functional flow
//(instead of checking the variable inside the function :( )
var toggleBuurtButtonTarget = function(sel) {
    if (sel === 'single') {
        $('#eenbuurtdata').html('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 18"><path d="M3.4 15.8c0 .6.2 1 .5 1.2.3.3.7.4 1.2.4.8 0 1.5-.3 2.2-1 .4-.4 1-1.2 1.8-2.3l-.5-.3c-.3.5-.6.9-1 1.3s-.7.6-.9.6c-.1 0-.2 0-.3-.1-.1-.1-.1-.2-.1-.3 0-.2.1-.5.2-1.1.1-.2.2-.6.3-1.2l1.9-6.8-1 .2c-.4.1-1 .2-1.8.3-.9 0-1.5 0-2 .1v.6c.5 0 .9.1 1.1.2.2.1.3.3.3.6v.4L3.8 14c-.1.4-.2.7-.2 1-.1.3-.2.6-.2.8zM8.1.8c-.4 0-.8.2-1.1.5-.4.2-.5.6-.5 1.1s.2.8.5 1.1c.2.3.6.5 1.1.5s.8-.2 1.1-.5c.3-.3.5-.7.5-1.1s-.2-.9-.5-1.2C8.9.9 8.5.8 8.1.8z"/></svg>').attr('title','Informatie over deze buurt');
    } else if (sel === 'all') {
        $('#eenbuurtdata').html('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 13"><path d="M11.5 4.6c-.9-.9-2.1-1.4-3.4-1.4h-5L5 1.3 3.8.1 0 3.9l3.8 3.8L5 6.6 3.1 4.7h5c.9 0 1.7.3 2.3.9.6.7.9 1.5.9 2.4 0 .9-.3 1.7-.9 2.3-.6.6-1.4.9-2.3.9H4.9v1.6h3.2c1.3 0 2.5-.5 3.4-1.4.9-.9 1.4-2.1 1.4-3.4s-.5-2.5-1.4-3.4z"/></svg>').attr('title','Alle buurten');
    }

}
var hideBuurtButton = function() {
    $('#eenbuurtdata').removeClass('buurt-button-shown');

}
var showBuurtButton = function() {
    $('#eenbuurtdata').addClass('buurt-button-shown');
}
var hideBuurtInfoBox = function() {
    $('#buurtinfobox').removeClass('buurt-box-shown');
}
var showBuurtInfoBox = function() {
    $('#buurtinfobox').addClass('buurt-box-shown');
}

//context switch for all/single buurt
app.singleBuurt = false;

app.colors = {
    6060309 : '#e30613',
    6060608 : '#fbb900',
    6060904 : '#4c2583',
    6060202 : '#b3b2b2',
    6060906 : '#479756',
    6060105 : '#e6007e',
    6060905 : '#616151',
    6060305 : '#a3c3b5',
    6060303 : '#ef7900',
    6060103 : '#00266e',
    6060602 : '#2bb989',
    6060000 : '#59127a',
    6060907 : '#006fb9',
    6060603 : '#94c356',
    6060607 : '#d8a165',
    6060104 : '#7180cb',
    6060101 : '#b80000',
    6060703 : '#e9c913',
    6060201 : '#ff8400',
    6060402 : '#b283ab',
    6060702 : '#a1a1a1',
    6060404 : '#737898',
    6060902 : '#95daee',
    6060102 : '#8573b2',
    6060301 : '#a75e10',
    6060606 : '#cbae08',
    6060106 : '#326592',
    6060908 : '#a95e85',
    6060403 : '#a37902',
    6060903 : '#3d6b00',
    6060704 : '#47bdb1',
    6060302 : '#bf670d',
    6060307 : '#7b9ebc',
    6060308 : '#a3c3b5',
    6060203 : '#6ebb99',
    6060306 : '#323232',
    6060304 : '#5b69c1',
    6060901 : '#025e06',
    6060107 : '#ffb76d',
    6060401 : '#bf9ba5'
}
//unused colors
// : '#e2698a'
// : '#dac27d'
// : '#00aab9'
// : '#8f3030'
// : '#ff4d58'
// : '#ffb2b6'
// : '#f1bee9'
// : '#48c030'
// : '#beb7e9'

app.scaleMax = {
    day: 900,
    week: 5000,
    month: 21000
};

app.defaultSliderOpts = {
    // Create two timestamps to define a range.
    behaviour: 'drag',
    connect: true,
//    limit: 30 * 24 * 60 * 60 * 1000,
    range: {
        min: timestamp('2014'),
        max: timestamp('2015-06-30')
    },
        // Steps of one day
    step:  24 * 60 * 60 * 1000,
        // Two more timestamps indicate the handle starting positions.
    start: [ timestamp('2015-06-01'), timestamp('2015-06-30') ],
        // No decimals
    format: wNumb({
        decimals: 0
    })
}
app.sliderInterval = 1;
app.sliderRange = [app.defaultSliderOpts.range.min,app.defaultSliderOpts.range.max];

$.datepicker.setDefaults($.datepicker.regional['nl']);



//initialize the map
var map = L.map('map-canvas', {zoomControl: false});
map.attributionControl.setPrefix('');
map.addControl(L.control.zoom({position: "topright"}));

//maak een basiskaartlaag - tegels
var achtergrondkaart =  L.tileLayer(
        'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '<a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 18
        }
        );
achtergrondkaart.addTo(map);


function processSelect(id) {
    buurten.eachLayer(function(layer) {
        if (layer.feature.id == id) {
            highlightFeature(null,layer);
            zoomToFeature(null,layer);
        }
    });
}

function style(feature){
    return {
        weight: 1,
        opacity: 1,
        color: "black",
        fillColor: "black",
        fillOpacity: 0.1
    };
}

function highlightFeature(e, target) {
    var layer = target ? target : e.target;
    layer.setStyle({
        weight: 3,
        color: '#fff ',
    });
    if (!app.singleBuurt) {
    d3.selectAll("circle")
        .classed("circleLight", function(d) {
            if (d.bu_code == layer.feature.id || d.bu_code == currentdotid) {
                return true;
            } else {
                return false;
            }
        });
    }
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
}

var getObj = function(set, obj, key){
    for (var i = 0; i<set.length; i++){
        if (set[i][key] == obj){
            return set[i];
            break;
        }
    }
};

function resetHighlight(e) {
    var layer = e.target;
    if (currentlayer != layer){ //only unhighlight if layer we're leaving is not 'pinned'.
        //$('#hoverlabelpanel').html(' ');
        buurten.resetStyle(e.target);
    }
    if (currentlayer){
        currentlayer.bringToFront();
    }
    d3.selectAll("circle")
        .classed("circleLight", function(d) {
            if (d.bu_code == currentdotid) {
                return true;
            } else {
                return false;
            }
        });
    // buurten.resetStyle(e.target);
}

var showBuurtAggregateInfo = function(id) {
    var mybuurt = app.currentData.filter(function(el, ind, ar) {
        if (el.bu_code === id) {
            return true;
        }
    })
    if (mybuurt.length > 0 ) {
    $('#meld').text('meldingen: '+mybuurt[0].meldingen);
    $('#stort').text('stortingen: '+mybuurt[0].dumps);
    $('#vul').text('vullingspercentage: '+mybuurt[0].fillperc);
   }

}

function zoomToFeature(e, target) {
    var layer = target ? target : e.target;
    map.fitBounds(layer.getBounds());
    if (currentlayer && currentlayer != layer) {
        buurten.resetStyle(currentlayer);
        currentlayer = null;
        currentdotid = null;
    }

    currentlayer = layer;
    currentdotid = layer.feature.id;
    d3.selectAll("circle")
        .classed("circleLight", function(d) {
            if (d.bu_code == currentdotid) {
                return true;
            } else {
                return false;
            }
        });
    $('#ttinput').typeahead('val',layer.feature.properties.name);
    if (!app.singleBuurt) {
        showBuurtButton();
        toggleBuurtButtonTarget('single');
    } else {
        var dates = dateSlider.noUiSlider.get();
        var opts = {start:formatDateAsYMD(dates[0]),end:formatDateAsYMD(dates[1]),agg:'false',name:$('#ttinput').typeahead('val')} 
        getData(opts).then(updateChart);
        updateMeldingen(opts);
    }
    if (!app.singleBuurt) {
        showBuurtInfoBox();
        showBuurtAggregateInfo(layer.feature.id);
    }
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

var setUpBuurtenLayer = function(data) {
    buurten = L.geoJson(topojson.feature(data, data.objects['buurten-schiedam']), {
        style: style,
        onEachFeature: onEachFeature
    });
    buurten.addTo(map);
    map.fitBounds(buurten.getBounds());

    buurten.eachLayer(function (layer) {
        if (layer._path) {
            layer._path.setAttribute("title", layer.feature.properties.name);
        } else {
            layer.eachLayer(function (noncontig) {
                noncontig._path.setAttribute("title", layer.feature.properties.name);
            });
        }
    });
    return data;
}
var enableTypeahead = function() {
    $('#ttinput').typeahead({
        minLength: 0,
        hint:false,
        highlight:true,
    },
    {
        name:'my-dataset',
        displayKey: 'name',
        source: searchdata.bloodhoundengine.ttAdapter()
            // templates: {
            //     header: app.searchHeaderTemplateGem,
            //     suggestion: app.searchSuggTemplateGem,
            //     empty: '<p></p>',
            //     footer: app.searchfooterTemplate
            // }
    })
};
var searchInputListeners = function(){
    $('#ttinput').on('typeahead:change', function(ev, suggestion) {
        //console.log('now it has changed')

    });
    $('#ttinput').on('keyup', function(e) {
        if(e.which == 13) {
            var value = $('#ttinput').typeahead('val');
            //console.log('entering'+value);
            findBuurt(value);
        }
        if ($('#ttinput').typeahead('val') === '') {
            hideBuurtButton();
        }
    });
    $('#ttinput').on('typeahead:autocomplete',function(ev, suggestion) {
        //console.log(suggestion+' was suggested');
        //console.log(suggestion);
    });

    $('#ttinput').on('focus', function(e) {
        $(e.currentTarget).select()
    });

    $('#ttinput').on('click', function(e) {
        $(e.currentTarget).select();

    })
};
var enableBloodhound = function() {
    searchdata.bloodhoundengine = new Bloodhound( {
        name: 'buurten-schiedam',
        local: searchdata,
        sorter: function(a, b) {
            return a.name > b.name;
        },
        datumTokenizer: function(d) {
            return Bloodhound.tokenizers.whitespace(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace 
    });
    searchdata.bloodhoundengine.initialize();
    //  $(searchdata).trigger('engine-initialized');
}
var parseBuurtenToSearchFormat = function(data) {
    //TODO: rewrite this with a map function, for goodness' sake!
    for (var i = 0; i<data.objects['buurten-schiedam'].geometries.length;i++) {
        var o = data.objects['buurten-schiedam'].geometries[i];
        searchdata.push(
            {name:o.properties.name,
                code:o.id
            }
        )
    }
}

getJson('../data/buurten-schiedam.topojson')
.then(setUpBuurtenLayer)
.then(parseBuurtenToSearchFormat)
.then(enableBloodhound)
.then(enableTypeahead)
.then(searchInputListeners)
.catch(function(error){
    console.log('big fat error!!!');
    console.log(error);

})


d3.json('../data/buurten-schiedam.topojson', function(error,data) {
});

//        voeg een icoon toe
var afvalbak = L.icon({
    iconUrl: 'gfx/afval.png',

});

var restafval = L.geoJson(verzamelcontainer, {
    filter: function(feature, layer) {
        return feature.properties.soort;
    },
    pointToLayer: function(feature, latlng) {
        var marker = L.marker(latlng, {icon: afvalbak});
        marker.bindPopup(feature.properties.soort);
        return marker;
    }
});

//           //        voeg een icoon toe
var school = L.icon({
    iconUrl: 'gfx/school.png',

});

var schoollaag = L.geoJson(scholen, {
    filter: function(feature, layer) {
        return feature.properties.VESTIGINGSNAAM;
    },
    pointToLayer: function(feature, latlng) {
        var marker = L.marker(latlng, {icon: school});
        marker.bindPopup(feature.properties.VESTIGINGSNAAM);
        return marker;
    }
});
schoollaag.addTo(map);

//        voeg een icoon toe
var melding = L.icon({
    iconUrl: 'gfx/melding.png',
});
var meldinghighlight = L.icon({
    iconUrl: 'gfx/meldinghighlight.png',
});

var meldingenlaag = L.geoJson(null, {
    filter: function(feature, layer) {
        return feature.properties.description;
    },
    pointToLayer: function(feature, latlng) {
        var marker = L.marker(latlng, {icon: melding});
        var desc = feature.properties.description.split(";")
            marker.bindPopup('<p><strong>' + desc[0] + '</strong><br />' + (desc[1]? desc[1] : '') + '<hr />' + feature.properties.date);
        return marker;
    }
});
meldingenlaag.addTo(map);
map.on('layeradd', function(e){
    ////console.log('a layer was really added to the map!')
});


function highlightMeldingen(date) {
    meldingenlaag.eachLayer(function(layer) {
        if (layer.feature.properties.date == formatDateAsYMD(new Date(date))) {
            layer.setIcon(meldinghighlight);
        }
    });
}

function unHighlightMeldingen(date) {
    meldingenlaag.eachLayer(function(layer) {
            layer.setIcon(melding);
    });
}

function updateMeldingen(val) {
    clusters.clearLayers();
    //console.log('we are gong to add data!');
    meldingenlaag.clearLayers();
    map.removeLayer(meldingenlaag);
    if (val) {
        var url ="https://places.geocoders.nl/civity/990b421a/meldingen?"+
            (val.date ? "date="+val.date
            : "start="+val.start+"&end="+val.end)
            + (val.name?"&name="+val.name:'')
        getJson(url)
        .then(function(data) {
            //console.log(data);
            meldingenlaag.addData(data[0].row_to_json);
            //if (app.singleBuurt) {
            //    meldingenlaag.addTo(map);
            //} else 
                clusters.addLayer(meldingenlaag);
            //}
            map.fitBounds(clusters.getBounds());
    }).catch(function(error){
            console.log('error fetching meldingen:');
            console.log(error);
        })
        }
}

var clusters = new L.markerClusterGroup();

map.on('zoomend', onZoomend);
function onZoomend(){
    if(map.getZoom()>=15) {
        map.addLayer(restafval);
        map.addLayer(schoollaag);
      //  if (!app.singleBuurt) {
            clusters.addLayer(meldingenlaag); 
            clusters.addTo(map);
      //  }

    } else if(map.getZoom()<15) {
        map.removeLayer(restafval);
        map.removeLayer(schoollaag);
        if (map.hasLayer(clusters)) {
            clusters.clearLayers();
        }
    };
};

//    slider     Create a list of day and monthnames.
var weekdays = [
    "maa", "din",
    "woe", "don", "vrij",
    "zat", "zon" 
], months = [
        "- 01 -", "- 02 -", "- 03 -",
        "- 04 -", "- 05 -", "- 06 -", "- 07 -",
        "- 08 -", "- 09-", "- 10 -",
        "- 11 -", "- 12 -"
];





var dateSlider = document.getElementById('slider-date');
noUiSlider.create(dateSlider, app.defaultSliderOpts);


var updateSlider = function() {
    //change slider step and range
    

}


//
//dateSlider.noUiSlider.on('update', function( values, handle ) {
//	dateValues[handle].innerHTML = formatDate(new Date(+values[handle]));
//});
//        


var tipHandles = dateSlider.getElementsByClassName('noUi-handle'),
    tooltips = [];

var filters = document.getElementById('filters');

// Add divs for date input/feedback.
for ( var i = 0; i < tipHandles.length; i++ ){
    tooltips[i] = document.createElement('input');
    filters.appendChild(tooltips[i]);
    $(tooltips[i]).datepicker();
    tooltips[i].index = i;
    tooltips[i].className += ' slider-tooltip';
    $(tooltips[i]).datepicker('option','dateFormat','D, dd-mm-yy');
    $(tooltips[i]).datepicker('option','onSelect', function(dateString,inst) {
            if (this.index === 0) {
                dateSlider.noUiSlider.set([$(this).datepicker('getDate').getTime(),null]);
            } else if (this.index === 1) {
                dateSlider.noUiSlider.set([null, $(this).datepicker('getDate').getTime()]);
            }
            $(this).blur();
        });
}
//if we need the following, move it into above loop
//for (var i=0; i <tooltips.length; i++){
//    // Add a class for styling
//    // Add additional markup
//    //tooltips[i].innerHTML = '<strong> </strong><span></span>';
//    // Replace the tooltip reference with the span we just added
//    //tooltips[i] = tooltips[i].getElementsByTagName('span')[0];  
//}
tipHandles[0].className += ' handle-left';
tipHandles[1].className += ' handle-right';
// When the slider changes, write the value to the tooltips.
dateSlider.noUiSlider.on('update', function( values, handle ){
    $(tooltips[handle]).datepicker('setDate',new Date(+values[handle]));
});
tooltips[0].className += ' slider-tooltip-left';
tooltips[1].className += ' slider-tooltip-right';
//zoekfunctie

//recomputeHeights();

//window.on('resizeend', function(e) {
//    recomputeHeights();
//    getData();
//});

// needed to setup fill color
var cValue = function(d) { return d.bu_code;};


//function to reconfigure slider range/step
var lockSlider = function(){


}


var computeSliderRange = function(e) {
    var oneDay = 24*60*60*1000;
    var rawdays = Math.floor((Math.floor(e[1]) - Math.floor(e[0])) / oneDay)
    return (rawdays <= 3 ? 1 :
            rawdays <= 14 ? 7 :
            30)

}


var reconfigureSlider = function(opts) {
    if (opts) {
        var newopts = $.extend({}, app.defaultSliderOpts, opts);

    }

}

//figure out which handle changed by comparing to current slider val
var diffSliderRange = function(e) {
    var val1 = e[0] === app.sliderRange[0] ? null : e[0],
        val2 = e[1] === app.sliderRange[1] ? null : e[1];
    return([val1,val2]);


}

dateSlider.noUiSlider.on('slide', function(e) {
        var dates = dateSlider.noUiSlider.get();
        //need to reconfigure the slider for new range and set a state var to know how to handle yMax
        //console.log(e);
        var slidval = computeSliderRange(e);
        var newrange = diffSliderRange(e);
        app.sliderRange = newrange;
        //console.log('newrange');
        //console.log(newrange);
        if (slidval !== app.sliderInterval) {
            //console.log('set a new range!');
            app.sliderInterval = slidval;
            reconfigureSlider({start:newrange});
        }
})

var sliderUpdate = function(e,h) {
    var dates = dateSlider.noUiSlider.get();
    //need to reconfigure the slider for new range and set a state var to know how to handle yMax
    //console.log(e);
    //console.log(computeSliderRange(e));
    //set the changing handle to the other handle plus/minus snap range.
    var opts = {start:formatDateAsYMD(dates[0]),end:formatDateAsYMD(dates[1]),agg:app.singleBuurt?'false':'true'};
    if (app.singleBuurt) {
        opts.name = $('#ttinput').typeahead('val')
        updateMeldingen(opts);
    }
    getData(opts).then(updateChart)
}
dateSlider.noUiSlider.on('change', sliderUpdate);
dateSlider.noUiSlider.on('set', sliderUpdate);

var initChart = function() {
    // add the graph canvas to the body of the webpage
    svg = d3.select("#chartcontainer").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("class", "label")
    .attr("x", width)
    .attr("y", 40)
    .style("text-anchor", "end")
    .text("gem. vullingsperc. van de containers"+ (app.singleBuurt?"":"per buurt"));

    // y-axis
    svg.selectAll(".y.axis")
    .call(yAxis);
    svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", -65)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("totaal aantal stortingen" + (app.singleBuurt?"":"per buurt"));

    // add the tooltip area to the webpage
    tooltip = d3.select("#chartcontainer").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
}

var getData = function(opts) {
    if (opts) {
        var url ="https://places.geocoders.nl/civity/990b421a/?"+
            (opts.date ? "date="+opts.date
            : "start="+opts.start+"&end="+opts.end)
            + (opts.name?"&name="+opts.name:'')
            + (opts.agg?"&agg="+opts.agg:'')
        return getJson(url);
    }
    else { return Promise.reject('call getData with options argument.');}
}
/* 
    * value accessor - returns the value to encode for a given data object.
    * scale - maps value to a visual display encoding, such as a pixel position.
    * map function - maps from data value to display value
    * axis - sets up axis
    */ 
// setup x 
var xValue = function(d) {return d.fillperc}; // data -> value
var xScale = d3.scale.linear().range([0, width]), // value -> display
xMap = function(d) { return xScale(xValue(d));}, // data -> display
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

// setup y
var yValue = function(d) {
    return +d.dumps
}; // data -> value
var yScale = d3.scale.linear().range([height, 0]), // value -> display
yMap = function(d) { return yScale(yValue(d));}, // data -> display
    yAxis = d3.svg.axis().scale(yScale).orient("left");
// don't want dots overlapping axis, so add in buffer to data domain
//xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
xScale.domain([0, 100]);


var updateChart = function(data) {
        hideNoDataInfo();
        app.currentData = data;
        //console.log(d3.max(data, yValue));
        yScale.domain([0, +d3.max(data,yValue)])
        //yScale.domain([0, 18000])
        svg.select('.y.axis').transition().duration(1000).call(yAxis);
        //svg.selectAll(".x.axis")
        //.remove();
        //svg.selectAll(".y.axis")
        //.remove();
        // draw dots
        var dot = svg
        .selectAll(".dot")
        .data(data);


        dot
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", function(d) { return( d.meldingen? Math.sqrt(10+ d.meldingen * 10): 10);})
        .attr("cx", xMap)
        .attr("cy", yMap)
        .style("fill", function(d) { return app.colors[cValue(d)];})

        dot
        .transition()
        .duration(1000)
        .attr("r", function(d) { return( d.meldingen? Math.sqrt(10+ d.meldingen * 10): 10);})
        .attr("cx", xMap)
        .attr("cy", yMap)
        .style("fill", function(d) { return app.colors[cValue(d)];})

        dot
        .on("click", function(d) {
            if (!app.singleBuurt) {
                currentdotid = d.bu_code;
                processSelect(d.bu_code);
            } else {
                //unHighlightMeldingen();
                //highlightMeldingen();
                updateMeldingen({date:formatUTCDateAsYMD(d.date),name:d.name});
            }
        })
        .on("mouseover", function(d) {
            tooltip.transition()
            .duration(200)
            .style("opacity", .9);

            tooltip.html((!app.singleBuurt ? '<p class="tooltip_title">' + d.name +  '</p>' : '') +
                    '<p class="tooltip-data">' + (app.singleBuurt ? 'datum: ' + formatDate(new Date(Date.parse(d.date))) + '<br/>': '') + 'stortingen: ' + d.dumps + '<br/>' + 'vullingsperc.: ' + d.fillperc +'<br/>' + 'meldingen: ' +d.meldingen)
                .style('left', (d3.event.pageX + 5) + 'px')
                .style('top', (d3.event.pageY - 200) + 'px');
        })
        .on('mouseout', function(d) {
            tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        });

        dot.exit().remove();
        if (app.singleBuurt) {
            dot.attr('class', 'dot dotGreyStroke');
        }

        if (!app.singleBuurt) {
            showBuurtAggregateInfo(getObj(data,$('#ttinput').typeahead('val'),'name').bu_code);
        }
        if (currentdotid) {
            d3.selectAll("circle")
            .classed("circleLight", function(d) {
                if (d.bu_code == currentdotid) {
                    return true;
                } else {
                    return false;
                }
            });
        }
        if (data.length == 0) {
            showNoDataInfo();
        }
}
var getDataOld = function(week) {
    d3.json("https://places.geocoders.nl/civity/990b421a/?start="+week.start+"&end="+week.end+"&agg="+week.agg+(week.name?"&name="+week.name:''), function (error, data){
        hideNoDataInfo();
        app.currentData = data;

        /* 
         * value accessor - returns the value to encode for a given data object.
         * scale - maps value to a visual display encoding, such as a pixel position.
         * map function - maps from data value to display value
         * axis - sets up axis
         */ 
        // setup x 
        var xValue = function(d) {return d.fillperc}; // data -> value
        var xScale = d3.scale.linear().range([0, width]), // value -> display
        xMap = function(d) { return xScale(xValue(d));}, // data -> display
            xAxis = d3.svg.axis().scale(xScale).orient("bottom");

        // setup y
        var yValue = function(d) { return d.dumps}; // data -> value
        var yMax = d3.max(data, yValue);
        yScale = d3.scale.linear().range([height, 0]), // value -> display
        yMap = function(d) { return yScale(yValue(d));}, // data -> display
            yAxis = d3.svg.axis().scale(yScale).orient("left");



        // don't want dots overlapping axis, so add in buffer to data domain
        //xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
        xScale.domain([0, 100]);
        //console.log(d3.max(data, yValue));
        //if (app.singleBuurt) {
        yScale.domain([0, +d3.max(data,yValue)])
        svg.selectAll(".x.axis")
        .remove();

        svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", 40)
        .style("text-anchor", "end")
        .text("gem. vullingsperc. van de containers"+ (app.singleBuurt?"":"per buurt"));

        // y-axis
        svg.selectAll(".y.axis")
        //.remove();
        .call(yAxis);
        svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", -65)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("totaal aantal stortingen" + (app.singleBuurt?"":"per buurt"));

        // draw dots
        var dot = svg
        .selectAll(".dot")
        .data(data);  

        dot
        .enter()
        .append("circle");

        dot
        .transition()
        .duration(1000)
        .attr("r", function(d) { return( d.meldingen? Math.sqrt(10+ d.meldingen * 10): 10);})
        .attr("cx", xMap)
        .attr("cy", yMap);

        dot
        .attr("class", "dot")
        .style("fill", function(d) { return app.colors[cValue(d)];})
        .on("click", function(d) {
            if (!app.singleBuurt) {
                currentdotid = d.bu_code;
                processSelect(d.bu_code);
            } else {
                //unHighlightMeldingen();
                //highlightMeldingen();
                updateMeldingen({date:formatUTCDateAsYMD(d.date),name:d.name});
            }
        })
        .on("mouseover", function(d) {
            tooltip.transition()
            .duration(200)
            .style("opacity", .9);

            tooltip.html((!app.singleBuurt ? '<p class="tooltip_title">' + d.name +  '</p>' : '') +
                    '<p class="tooltip-data">' + (app.singleBuurt ? 'datum: ' + formatDate(new Date(Date.parse(d.date))) + '<br/>': '') + 'stortingen: ' + d.dumps + '<br/>' + 'vullingsperc.: ' + d.fillperc +'<br/>' + 'meldingen: ' +d.meldingen)
                .style('left', (d3.event.pageX + 5) + 'px')
                .style('top', (d3.event.pageY - 200) + 'px');
        })
        .on('mouseout', function(d) {
            tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        });

        if (app.singleBuurt) {
            dot.attr('class', 'dot dotGreyStroke');
        }
        dot.exit().remove();

        if (!app.singleBuurt) {
            showBuurtAggregateInfo(getObj(data,$('#ttinput').typeahead('val'),'name').bu_code);
        }
        if (currentdotid) {
            d3.selectAll("circle")
            .classed("circleLight", function(d) {
                if (d.bu_code == currentdotid) {
                    return true;
                } else {
                    return false;
                }
            });
        }
        if (data.length == 0) {
            showNoDataInfo();
        }
    })



};


$('#eenbuurtdata').click(function(e) {
    if (app.singleBuurt) {
        var dates = dateSlider.noUiSlider.get();
        getData({start:formatDateAsYMD(dates[0]),end:formatDateAsYMD(dates[1]),agg:'true'}).then(updateChart)
        //updateMeldingen({start:formatDateAsYMD(dates[0]),end:formatDateAsYMD(dates[1])});
        updateMeldingen();
        hideBuurtButton();
        app.singleBuurt = false;
        showBuurtInfoBox();
    } else {
        app.singleBuurt = true;
        var dates = dateSlider.noUiSlider.get();
        var buurtname = $('#ttinput').typeahead('val');
        getData({start:formatDateAsYMD(+dates[0]),end:formatDateAsYMD(+dates[1]),agg:'false',name: buurtname}).then(updateChart)
        updateMeldingen({start:formatDateAsYMD(+dates[0]),end:formatDateAsYMD(+dates[1]),name:buurtname});
        toggleBuurtButtonTarget('all');
        hideBuurtInfoBox();
        
    }

})
initChart();

//getData({start:'2015-06-01',end:'2015-06-30', agg:'true'});
getData({start:'2015-06-01',end:'2015-06-30', agg:'true'})
.then(updateChart)
.catch(function(e) {
    console.log(e)
})

