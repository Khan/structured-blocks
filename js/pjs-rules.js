// Shapes

JSRules.addRule(JSASTRule.extend({
    image: "rect.png",
    structure: function() {
        rect($x_number, $y_number, $width_number, $height_number);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "line.png",
    structure: function() {
        line($x1_number, $y1_number, $x2_number, $y2_number);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "bezier.png",
    structure: function() {
        bezier($x1_number, $y1_number, $cx1_number, $cy1_number, $cx2_number, $cy2_number, $x2_number, $y2_number);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "ellipse.png",
    structure: function() {
        ellipse($x_number, $y_number, $width_number, $height_number);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "point.png",
    structure: function() {
        point($x_number, $y_number);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "quad.png",
    structure: function() {
        quad($x1_number, $y1_number, $x2_number, $y2_number, $x3_number, $y3_number, $x4_number, $y4_number);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "triangle.png",
    structure: function() {
        triangle($x1_number, $y1_number, $x2_number, $y2_number, $x3_number, $y3_number);
    }
}));

JSRules.addRule(JSASTRule.extend({
    image: "arc.png",
    structure: function() {
        arc($x_number, $y_number, $width_number, $height_number, $start_number, $stop_number);
    }
}));

// TODO: Handle additional height/width args
JSRules.addRule(JSASTRule.extend({
    image: "image.png",
    structure: function() {
        image($image_image, $x_number, $y_number);
    }
}));

// Colors

JSRules.addRule(JSASTColorRule.extend({
    structure: function() {
        background($r_rgb, $g_rgb, $b_rgb);
    }
}));

JSRules.addRule(JSASTColorRule.extend({
    structure: function() {
        fill($r_rgb, $g_rgb, $b_rgb);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        noFill();
    }
}));

JSRules.addRule(JSASTColorRule.extend({
    structure: function() {
        stroke($r_rgb, $g_rgb, $b_rgb);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        strokeWeight($size_number);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        noStroke();
    }
}));

JSRules.addRule(JSASTColorRule.extend({
    structure: function() {
        color($r_rgb, $g_rgb, $b_rgb);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        blendColor($c1_color, $c2_color, $mode_number);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        lerpColor($c1_color, $c2_color, $amount_number);
    }
}));

// Text

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        text($text_string, $x_number, $y_number);
    }
}));

// TODO: Handle additional size argument
JSRules.addRule(JSASTRule.extend({
    structure: function() {
        textFont($font_string);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        textSize($size_number);
    }
}));

// Transforms

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        rotate($angle_number);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        scale($amount_number);
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        translate($x_number, $y_number);
    }
}));
