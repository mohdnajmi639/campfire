const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace MemberRole import
    content = content.replace(/import \{ MemberRole \} from "@\/models\/Member";/g, 'import { MemberRole } from "@/types";');
    content = content.replace(/import Member, \{ MemberRole \} from "@\/models\/Member";/g, 'import Member from "@/models/Member";\nimport { MemberRole } from "@/types";');
    
    // Replace ChannelType import
    content = content.replace(/import \{ ChannelType \} from "@\/models\/Channel";/g, 'import { ChannelType } from "@/types";');
    content = content.replace(/import Channel, \{ ChannelType \} from "@\/models\/Channel";/g, 'import Channel from "@/models/Channel";\nimport { ChannelType } from "@/types";');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
