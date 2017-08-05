# Canvas-Tabletop-Simulator
Tabletop board simulator using HTML5 canvas and JS/jQuery for the board with a C# .NET and Azure table/blob storage back-end. SignalR handles communication between users/clients.

## About
This was mostly to explore the viability of simulating a tabletop board on the web with just canvas, JS, and a light back-end. I started work on it after I got into Warmachine/Hordes and wished I had an easier way to play with remote friends. For anyone else looking for that fix, Vassal and Tabletop Simulator on Steam are solid choices.

### Pros
- Tokens creation with custom images.
- Drag and drop functionality with tokens. Placement preview for tokens. Copy and paste, delete, rotate tokens. 
- Tokens are automatically shared with anyone in their game including their creation/deletion, location, and facing.
- Virtual "tape measurer": distance can be measured in relative game board inches. Users can see each other's tape measurer use.
- Quality of life features such as easily seeing the radius around tokens on number press.

### Cons/To Do
- Separate users by  game instances. Right now, all board movements, token creation/deletion, chat and dice rolls occur for everyone using the application.

- Separate temp token files by game. Generate an individual semi-permanent token storage per game instead of pulling all relevant tokens for each game into a same folder.
