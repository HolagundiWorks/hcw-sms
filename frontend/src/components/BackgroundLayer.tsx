// Fixed, full-viewport animated background behind the liquid-glass UI.
// Swap BG to any file in frontend/public/bg/:
//   school_bg_option_1_air_lines.svg      (flowing gradient lines — default)
//   school_bg_option_2_clean_streams.svg
//   school_bg_option_3_light_mesh.svg
//   school_geometric_animated_background.svg  (richest / most colourful)
// Rendered as <img> so the SVG's own CSS animations play.
const BG = '/bg/school_bg_option_1_air_lines.svg';

export function BackgroundLayer() {
  return <img className="app-bg-img" src={BG} alt="" aria-hidden />;
}
