const fs = require('fs');
let code = fs.readFileSync('client/src/pages/Events/Events.js', 'utf8');
code = code.replace(
  /\{\/\* Gradient Overlay \*\/\}[\s\S]*?\{\/\* Event Title Overlay \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  `{/* Gradient Overlay */}
<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
</div>

{/* Event Title Overlay (Always visible) */}
<div className="absolute bottom-4 left-4 right-4 z-10">
  <h3 className="text-white text-lg font-bold mb-1 overflow-hidden drop-shadow-md" style={{
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
  }}>
    {event.title}
  </h3>
  <div className="flex items-center gap-2">
    <span className="text-gray-200 text-sm font-medium" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
      {getCategoryIcon(event.category)} {event.category}
    </span>
  </div>
</div>`
);
fs.writeFileSync('client/src/pages/Events/Events.js', code);
console.log('Done');
