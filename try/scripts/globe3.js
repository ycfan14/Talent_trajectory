d3.csv("https://gist.githubusercontent.com/zhengyunhan/9e4389a57caff817763c8ed55bdc77ff/raw/60cddf7ed40d787954b04d3871957826244ce2ce/inoutflow_5years.csv", function(allflow){
var width = 960,
    height = 500;

var velocity = .01;

var projection = d3.geoOrthographic()
.scale((height - 10) / 2)
.translate([width / 2, height / 2])
.precision(0.1)
.rotate([-10,-30]);

var loftedProjection = d3.geoOrthographic()
    .scale(((height - 10) / 2) * 1.3)
    .translate([width / 2, height / 2])
    .precision(0.1)
    .rotate([-10,-30]);;

var canvas = d3.select("body").append("canvas")
    .attr("width", width)
    .attr("height", height);

var context = canvas.node().getContext("2d");

    // retina display
var devicePixelRatio = window.devicePixelRatio || 1;
  canvas.style('width', canvas.attr('width')+'px');
  canvas.style('height', canvas.attr('height')+'px');
  canvas.attr('width', canvas.attr('width') * devicePixelRatio);
  canvas.attr('height', canvas.attr('height') * devicePixelRatio);
  context.scale(devicePixelRatio,devicePixelRatio);

var path = d3.geoPath()
    .projection(projection)
    .context(context);

var swoosh = d3.line()
    .curve(d3.curveNatural)
    .defined(function(d) { return projection.invert(d); })
    .context(context);

var backprojection = d3.geoProjection(function(a,b) {
  return d3.geoOrthographicRaw(-a,b);
})
  .clipAngle(90)
  .translate(projection.translate())
  .scale(projection.scale());

var backpath = d3.geoPath()
    .projection(backprojection)
    .context(context);

function locationAlongArc(start, end, theta) {
    return d3.geoInterpolate(start, end)(theta);
};

var e = document.getElementById("selected_institution");
var selected_inst= e.options[e.selectedIndex].value.toLowerCase();

var feature=[]
var links=[]
var selectedData = Object.create(null);
var lines=[]

allflow.forEach(function(a) {
  if (parseFloat(a[selected_inst])==1) {
                var source_lat = parseFloat(a.lat),
                    source_lng = parseFloat(a.lng),
                    target_lat = parseFloat(a.des_lat),
                    target_lng = parseFloat(a.des_lng);
    
                // Build GeoJSON feature from this link
                 feature.push ({ 
                    type: 'Feature', 
                    geometry: { 
                        type: "LineString",
                        coordinates: [[source_lng,source_lat], [target_lng,target_lat]]
                    },
                    properties: {
                        sourceSchool: a.name,
                        targetSchool: a.des_schoolname,
                        sourceCountry: a.country,
                        targetCountry: a.des_country
                    }
                });
                links.push({
                    source: [source_lng,source_lat],
                    target: [target_lng,target_lat],
                    feature: feature
                });
                selectedData.type = "FeatureCollection",
                selectedData.features = feature
                }
            }
    )

links.forEach(function(a) {
        var source = a.source,
            target = a.target,
            middle = locationAlongArc(source, target, 0.5);
        lines.push ([
            projection(source),
            loftedProjection(middle),
            projection(target)
        ]);
    })
  

d3.json("https://unpkg.com/world-atlas/world/110m.json", function(error, world) {
  if (error) throw error;

  var land = topojson.feature(world, world.objects.land);

  d3.timer(function(elapsed) {
    var rotate = projection.rotate();
    rotate[0] += velocity * 20;
    projection.rotate(rotate);
    render();
  });

function render() {
  var rotate = projection.rotate();
    backprojection.rotate([rotate[0] + 180, -rotate[1], -rotate[2]]);

    context.clearRect(0, 0, width, height);

    context.beginPath();
    path({type:"Sphere"});
    context.fillStyle = '#fcfcfc';
    context.fill();

    context.beginPath();
    backpath(land);
    context.fillStyle = '#d0ddfa';
    context.fill();
    context.beginPath();
    backpath(d3.geoGraticule()());
    context.lineWidth = .1;
    context.strokeStyle = '#97b3f6';
    context.stroke();


    context.beginPath();
    path(d3.geoGraticule()());
    context.lineWidth = .1;
    context.strokeStyle = '#1046c6';
    context.stroke();

    context.beginPath();
    path(land);
    context.lineWidth = 1;
    context.strokeStyle = '#1046c6';
    context.stroke();
    context.fillStyle = '#5c88ee';
    var alpha = context.globalAlpha;
    context.globalAlpha = 1;
    context.fill();
    context.globalAlpha = alpha;

    context.beginPath();
    path({type: "Sphere"});
    context.lineWidth = .1;
    context.strokeStyle = '#1046c6';
    context.stroke();

    context.beginPath();
    path(selectedData);
    context.lineWidth = 1;
    context.stroke();

    context.beginPath();
    swoosh(lines[0]);
    context.lineWidth = 1;
    context.stroke();

} 
})
}
)