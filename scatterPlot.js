//global variables
var file, mergedData;
var xScale, yScale, rScale, colorScale, timeScale;
var svg, svgDiv, svgHeight, svgWidth;

var timeSlider = d3.select('#timeRange');
var timeLabel = d3.select('#timeLabel');
function timeUpdate(val) {
    timeLabel.text(val);
}

document.addEventListener('DOMContentLoaded', function(){
    
    //setting global vars and drawing csv
    svgDiv = document.getElementById("svgDiv");
    svgWidth = +svgDiv.offsetWidth;
    svgHeight = +svgDiv.offsetHeight;

    svg = d3.select("#svgDiv")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("id", "drawnSvg");

    fetchCsvCallOthers();
});

// Fetches the csv, calls other functions
function fetchCsvCallOthers(){

    var drawnSvg = document.getElementById("drawnSvg");
    //removing previously drawn circles
    if(drawnSvg != undefined)
    d3.selectAll("circle").remove();

    checkRadio();

    d3.csv(file)
    .then(function(data){
        //converting all rows to int
        data.forEach(function(d) {
            d.time = +d.time;
            d.duration = +d.duration;
            d.x = +d.x;
            d.y = +d.y;
            d.avg_dilation = +d.avg_dilation;
        });
        mergedData = data;
        setScales(mergedData);  
        drawCircles(mergedData);
        // console.log('after drawCircles call');
    });
}

// Checks which radio button is checked
function checkRadio(){
    if(document.getElementById("treeRadio").checked) {
        file = "./data_preprocessed/merged_tree.csv";
        console.log('tree data');
    } else {
        file = "./data_preprocessed/merged_graph.csv";
        console.log('graph data');
    }
}

// Sets the scales for x, y coordinates, duration and avg_dilation
function setScales(data){
    const xValue = d => d.x;
    const yValue = d => d.y;
    const durationValue = d => d.duration;      // plot size
    const pupilValue = d => d.avg_dilation;  // plot color
    const timeValue = d => d.time;

    var xMax = d3.max(data, xValue);
    var xMin = d3.min(data, xValue);
    console.log('x '+xMin+' : '+xMax);
    var yMax = d3.max(data, yValue);
    var yMin = d3.min(data, yValue);
    console.log('y '+yMin+' : '+yMax);
    var durationMax = d3.max(data, durationValue);
    var durationMin = d3.min(data, durationValue);
    console.log('duration '+durationMin+' : '+durationMax);
    var pupilMax = d3.max(data, pupilValue);
    var pupilMin = d3.min(data, pupilValue);
    console.log('pupil '+pupilMin+' : '+pupilMax);
    var timeMax = d3.max(data, timeValue);
    var timeMin = d3.min(data, timeValue);
    console.log('time '+timeMin+' : '+timeMax);

    xScale = d3.scaleLinear()
        .domain([0, xMax])
        .range([0+20, svgWidth-50])
        .nice();
    yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([0+20, svgHeight-50])
        .nice();
    rScale = d3.scaleLinear()
        .domain([100, durationMax])
        .range([3, 23])
        .nice();
    colorScale = d3.scaleLinear()
        // .domain([0, (pupilMin+pupilMax)/2, pupilMax])   //show the distribution as it is
        // .domain([0, pupilMax*0.4, pupilMax])            //bit distorted
        .domain([0, 0.3, 1])                            //set standard for fixed legend
        .range(['#0066ff', '#d0ff00', '#f00000'])
        .interpolate(d3.interpolateHcl);
    timeScale = d3.scaleLinear()
        .domain([timeMin, timeMax])
        .range([0, 10])
        .nice();
        
    timeSlider.max = timeMax;
}

// Draws circle points
function drawCircles(data){

    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltipDiv")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("");
        
    var plots = svg.selectAll("circle")
        .data(data);
    plots.enter().append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", d => rScale(d.duration))
        .attr("fill", d => colorScale(d.avg_dilation))
        .attr("visibility","hidden")
        .on('mouseover', function(d, i) {
            const msg = "<b>duration</b> " + d.duration + "ms <br>"
                      + "<b>time</b> " + (d.time/1000).toFixed(2) + "s <br>"
                      + "<b>dilation</b> " + d.avg_dilation.toFixed(2) + "mm";
            tooltip.html(msg);
            tooltip.style("visibility", "visible");
            d3.select('#details').html(msg);
        })
        .on("mousemove", function(d, i) {
            return tooltip.style("top",
                (d3.event.pageY-10)+"px")
                    .style("left",(d3.event.pageX+10)+"px");
        })
        .on('mouseout', function(d, i){
            tooltip.style("visibility", "hidden");
            d3.select('#details').html('');
        })
        .transition()
        .delay(function(d, i){
            // console.log(timeScale(i*d.time));
            return timeScale(i*d.time);
        })
        .attr("visibility", "visible");
        // .transition().duration( (d,i) => {
        //     return timeScale(i*d.duration);
        // })
        // .attr('r', rScale(d.duration));

        // console.log('Drawing Done!');
}
