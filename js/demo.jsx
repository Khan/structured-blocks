var FromToContainer = React.createClass({
    render: function() {
        return <div>
            <SortableArea
                className="to"
                data={this.props.to}
                accept={true}
                editable={true}
                genComponent={this.props.genComponent}
                onReorder={() => true}/>
            <SortableArea
                className="from"
                data={this.props.from}
                accept={false}
                editable={false}
                genComponent={this.props.genComponent}
                onReorder={() => true}
                reorder={false}/>
        </div>;
    }
});

// TODO: Generate blocks for statements from AST automatically

// TODO: Generate AST/Code

// TODO: Sync position of element immediately on initial drag in

// TODO: Destroy To drag on leave drop
// TODO: Find a way to drag sub-components
//  - Be able to move a sub-component into another blank
//    - Limit it by the "type" and the accepted type
//  - Be able to "destroy" an existing sub-component - some how?

// TODO: Find a way to dynamically manage variables in the toolbox

$(function() {
    var key = 1;
    var genDragItem = function(data, props) {
        return <JSRule data={data} key={key++} draggable={true}
            editable={props.editable}/>;
    };

    var pool = [
        JSRules.parseStructure(function() {
            var name = true;
        }),
        JSRules.parseStructure(function() {
            var foo = false;
        }),
        JSRules.parseStructure(function() {
            ellipse(20, 20, 100, 100);
        }),
        {"type": "Literal", "value": 10},
        {"type": "Literal", "value": true}
    ];
    var rules = JSRules.parseProgram("var a = true;\n" +
        "ellipse(10, 20, 30, 40);");

    var rule = React.render(
        <FromToContainer from={pool} to={rules}
            genComponent={genDragItem}/>,
        $("#structured-blocks")[0]
    );

    //setInterval(function() {
        //$("#output").val(rule.toScript());
    //}, 100);
});