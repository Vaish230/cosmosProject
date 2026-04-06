const User = require("../models/userModel");

class ColorService {
  static generateColorFromName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash = hash & hash;
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 55%)`;
  }

  static hslToHex(hue, saturation, lightness) {
    saturation /= 100;
    lightness /= 100;

    const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lightness - c / 2;

    let r, g, b;
    if (hue < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (hue < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (hue < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (hue < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (hue < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    const toHex = (value) => {
      const hex = Math.round((value + m) * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  static async getUniqueColor(baseName) {
    let colorHex;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const hslColor = this.generateColorFromName(baseName + attempts);
      // Extract hue from HSL string
      const hue = parseInt(hslColor.match(/\d+/)[0]);
      colorHex = this.hslToHex(hue, 70, 55);

      // Check if color is already used
      const existingUser = await User.findOne({ color: colorHex });
      if (!existingUser) {
        isUnique = true;
      }
      attempts++;
    }

    return colorHex;
  }
}

module.exports = ColorService;
