var JSToolboxEditor = React.createClass({displayName: 'JSToolboxEditor',
    getInitialState: function() {
        var code = this.props.code;

        if (typeof code === "string") {
            code = JSRules.parseProgram(code);
        }

        var toolbox = this.props.toolbox || [];

        toolbox = toolbox.map(function(item) {
            if (typeof item === "object") {
                return item;
            }

            return JSRules.parseStructure(item);
        });

        return {
            code: code,
            toolbox: toolbox
        };
    },

    toScript: function() {
        return this.refs.to.getComponents();
    },

    genComponent: function(data, props) {
        if (!this.key) {
            this.key = 0;
        }

        return React.createElement(JSRule, {data: data, key: this.key++, 
            draggable: true, 
            editable: props.editable});
    },

    render: function() {
        return React.createElement("div", null, 
            React.createElement(SortableArea, {
                ref: "editor", 
                className: "editor", 
                data: this.state.code, 
                accept: true, 
                editable: true, 
                genComponent: this.genComponent, 
                onReorder: function()  {return true;}}), 
            React.createElement(SortableArea, {
                className: "toolbox", 
                data: this.state.toolbox, 
                accept: false, 
                editable: false, 
                genComponent: this.genComponent, 
                onReorder: function()  {return true;}, 
                reorder: false})
        );
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
    var toolbox = [
        function() {
            var name = true;
        },
        function() {
            var foo = false;
        },
        function() {
            ellipse(20, 20, 100, 100);
        },
        {"type": "Literal", "value": 10},
        {"type": "Literal", "value": true}
    ];

    var code = "var a = true;\nellipse(10, 20, 30, 40);";

    var rule = React.render(
        React.createElement(JSToolboxEditor, {toolbox: toolbox, code: code}),
        $("#structured-blocks")[0]
    );

    //setInterval(function() {
        //$("#output").val(rule.toScript());
    //}, 100);
});