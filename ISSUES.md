Known Issues
============

\#1 2014.03.09 **Zoom target offset**

Zooming on the map doesn't targt mounse position. It is offsetted left and top, depending on the scale factor. This is because of setting transform-origin to the upper left corner rather than the center. Either set origin back to center and use negative margins for proper positioning, or compensate mouse offset in JavasSript.

\#2 2013.03.09 **Webpage crash with large formats**

Chrome stops executing the script for too large document dimensions. Unfortunately, even A4 @ 300dpi is affected by this. Firefox takes it time with the user interface not responding, but finishes the document. Maybe not using data uri string as output can help.
