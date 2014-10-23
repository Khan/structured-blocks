var PJSEllipse = JSRules.addRule({
    mixins: [BlockMixin, JSMixin, JSASTMixin],

    statics: {
        structure: JSRules.parseStructure(function() {
            ellipse(_, _, _, _);
        })
    },

    getType: function(match) {
        return "statement";
    },

    render: function() {
        var children = this.getChildComponents();
        return React.createElement("div", {className: "block block-statement"}, 
            'ellipse(', 
            React.createElement(BlankInput, null, children._[0]), ', ', 
            React.createElement(BlankInput, null, children._[1]), ', ', 
            React.createElement(BlankInput, null, children._[2]), ', ', 
            React.createElement(BlankInput, null, children._[3]), ');'
        );
    }
});