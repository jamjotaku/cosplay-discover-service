const fs = require('fs');
let code = fs.readFileSync('src/components/CosplayGallery.tsx', 'utf8');

code = code.replace(/filteredData\.length/g, 'filteredAndSortedData.length');
code = code.replace(/filteredData\.map/g, 'filteredAndSortedData.map');

const agencyFilterBlock = `{/* 事務所フィルター */}\n      <div className="flex space-x-2 overflow-x-auto pb-4 mb-8">`;
const newBlock = `{/* 事務所フィルター & 並び替え */}\n      <div className="flex flex-col sm:flex-row justify-between items-center mb-10 border-b border-gray-200 pb-4">\n        {/* 事務所タブ */}\n        <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 mb-4 sm:mb-0">`;

code = code.replace(agencyFilterBlock, newBlock);

const agencyFilterEndBlock = `</button>\n          )\n        )}\n      </div>`;
const newEndBlock = `</button>\n          )\n        )}\n        </div>\n\n        {/* 並び替えトグル */}\n        <div className="flex items-center space-x-2 bg-white rounded-full p-1 border border-gray-200 shadow-sm w-full sm:w-auto">\n          <button\n            onClick={() => setSortOrder("Default")}\n            className={\`flex-1 sm:flex-none px-4 py-2 rounded-full text-sm font-bold transition-all \${\n              sortOrder === "Default" \n                ? "bg-blue-50 text-blue-700 shadow-sm" \n                : "text-gray-500 hover:text-gray-700"\n            }\`}\n          >\n            追加順\n          </button>\n          <button\n            onClick={() => setSortOrder("Debut")}\n            className={\`flex-1 sm:flex-none px-4 py-2 rounded-full text-sm font-bold transition-all \${\n              sortOrder === "Debut" \n                ? "bg-blue-50 text-blue-700 shadow-sm" \n                : "text-gray-500 hover:text-gray-700"\n            }\`}\n          >\n            デビュー順\n          </button>\n        </div>\n      </div>`;

code = code.replace(agencyFilterEndBlock, newEndBlock);

fs.writeFileSync('src/components/CosplayGallery.tsx', code);
