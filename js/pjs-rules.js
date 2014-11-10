// Shapes

JSRules.addRule(JSASTRule.extend({
    image: "rect.png",
    structure: function() {
        rect($x, $y, $width, $height);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "line.png",
    structure: function() {
        line(_, _, _, _);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "bezier.png",
    structure: function() {
        bezier(_, _, _, _, _, _, _, _);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "ellipse.png",
    structure: function() {
        ellipse(_, _, _, _);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "point.png",
    structure: function() {
        point(_, _);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "quad.png",
    structure: function() {
        quad(_, _, _, _, _, _, _, _);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "triangle.png",
    structure: function() {
        triangle(_, _, _, _, _, _);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "arc.png",
    structure: function() {
        arc(_, _, _, _, _, _);
    }
}));

// TODO: Handle additional height/width args
JSRules.addRule(JSASTRule.extend({
    image: "image.png",
    structure: function() {
        image(_, _, _);
    }
}));

// Colors

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        background(_, _, _);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        fill(_, _, _);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        noFill();
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        stroke(_, _, _);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        strokeWeight(_);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        noStroke();
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        color(_, _, _);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        blendColor(_, _, _);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        lerpColor(_, _, _);
    }
}));

// Text

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        text(_, _, _);
    }
}));

// TODO: Handle additional size argument
JSRules.addRule(JSASTRule.extend({
    structure: function() {
        textFont(_, _);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        textSize(_);
    }
}));

// Transforms

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        rotate(_);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        scale(_);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        translate(_, _);
    }
}));