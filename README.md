# ![Instatools Logo](/tool/src/ui/mobile-logo.png)


Traditional visual editors like Canva rely on heavy WYSIWYG (What You See Is What You Get) DOM manipulation, tracking hundreds of drag-and-drop events, bounding boxes, and complex CSS layers in real-time. Every interaction forces the browser to recalculate the DOM tree. When it is time to export, they must rely on heavy external libraries (like html2canvas) to take a messy "screenshot" of the webpage, or they must send the data to a remote server to render the final image, which compromises privacy and speed.


Core Systems Behind 'Instatools' Architecture

State Saving: JSON-Driven UI keeps raw design logic out of the DOM. Instead of dragging elements around a canvas, the user's inputs update a lightweight, centralized window.state JSON object. The application then injects exact HTML and inline CSS strings directly into a static preview container (setCanvasHtml) based purely on those state values. 

Session Continuity: Pure Data Presets ensure edits, templates, and typography parameters are tracked strictly as data points. Because the design is just a JSON object (e.g., t6: { headline: "...", fontSize: 94, imagePosX: 46 }), the tool doesn't need to parse- complex HTML nodes or rely on a database backend. Users can export and import their entire workspace as local JSON files, picking up exactly where they left off.

Think in Code: Algorithmic Exporting means the app programs the final image instead of screen-capturing it. Rather than reading the DOM to guess how to draw the post, the export.js engine reads the JSON state and procedurally paints every layer, text wrap, gradient, and clipping mask onto an offscreen canvas using exact native Canvas 2D API math (e.g., ctx.drawImage, ctx.fillText). The code literally paints the pixels from scratch, ensuring pixel-perfect quality locally without any server dependency.


## Tools
- **Post Generator:** The primary design workspace for creating high-impact Instagram feed posts with advanced typography and layout controls.
- **Highlight Covers:** A specialized tool located in /tools/highlight/ for designing and exporting Instagram Story highlight covers.
- **Profile Pictures:** A dedicated tool in /tools/pfp/ specifically designed to frame, style, and export professional-grade profile pictures.

## Made with Instatools

<p align="center">
  <img src="https://github.com/nicholasxdavis/instatools/blob/main/example/post.png?raw=true" width="49%" alt="Instatools Example 1">
  <img src="https://github.com/nicholasxdavis/instatools/blob/main/example/post-two.png?raw=true" width="49%" alt="Instatools Example 2">
</p>

<p align="center">
  <img src="https://github.com/nicholasxdavis/instatools/blob/main/example/post-three.png?raw=true" width="49%" alt="Instatools Example 3">
  <img src="https://github.com/nicholasxdavis/instatools/blob/main/example/post-four.png?raw=true" width="49%" alt="Instatools Example 4">
</p>

##

## Comparison with Instatools


<table>
<tr>
<td align="center">

### Before Using Instatools
![Before](https://github.com/nicholasxdavis/instatools/blob/main/example/bf.jpg?raw=true)

Orphaned Posts  
Low reach & engagement

</td>

<td align="center">

### After Using Instatools
![After](https://github.com/nicholasxdavis/instatools/blob/main/example/af.jpg?raw=true)

Adopted Posts  

**13× more likes**  
**4.7× more shares**

</td>
</tr>
</table>

---

Instatools helps turn **ignored posts into high-performing content** by improving how your content is structured and presented for social media.
