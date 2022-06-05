import tinycolor from 'tinycolor2';

export function isDark(colorPallete) {
    return tinycolor(colorPallete).isDark();
}

export function updateColorOfInput(input, newColor) {
    $(input).spectrum('set', newColor);
}

export function initColorInput(input, options = {}) {
    let pallete = [
        ['#000000', '#ea6d2c', '#0e606b', '#8239ea', '#be0002', '#583320'],
        ['#5c667d', '#ffc300', '#299d86', '#0253a4', '#f04770', '#97582a'],
        ['#bababa', '#fef3af', '#54a630', '#3987fd', '#f798d0', '#baa262']
    ];

    if(options.flat) {
        pallete = [...pallete[0], ...pallete[1], ...pallete[2]];
    }
    
    const config = {
        showInput: true,
        className: "full-spectrum",
        showInitial: true,
        showPalette: true,
        // showSelectionPalette: true,
        maxSelectionSize: 10,
        preferredFormat: "hex",
        showPaletteOnly: true,
        palette: pallete,
        ...options
    };
    $(input).spectrum(config);
}