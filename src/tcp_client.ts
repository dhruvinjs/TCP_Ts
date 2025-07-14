import net from "net"

const PORT=4000
const HOST="localhost"
const clientSocket=new net.Socket()
let connectionEstablished=false
let intervalStarted=false
clientSocket.connect(PORT,HOST,()=>{
    clientSocket.setEncoding("utf-8")
    const syn_ack_message={
        type:"SYN_ACK",
        message:"Yes we can connect"
    }
    clientSocket.write(JSON.stringify(syn_ack_message)+'\r\n')
    clientSocket.on("data",(data:string)=>{
        const trimmed=data.trim()
        if(!trimmed) return


        let message;
        try {
            message = JSON.parse(trimmed);
        } catch (error) {
            console.error("Invalid JSON received:", data);
            clientSocket.write(JSON.stringify({ type: "error", message: "Invalid JSON format" }) + '\r\n');
            return;
        }


        if(message.type==="ACK"){
            connectionEstablished=true
            console.log("connection established from client")
            if(!intervalStarted){
                intervalStarted=true
            
            setInterval(() => {
                if (connectionEstablished) {
                    const convo_message = { type: "conversation" };
                    console.log("Conversation ping pong")
                    clientSocket.write(JSON.stringify(convo_message)+'\r\n');
                }
            }, 4000); // every 4 seconds
        }

        }
   
        if(message.type==="data"){
            const ack=message.ack
            const ack_recieved={
                type:"ack",
                ack_number:ack
            }
            clientSocket.write(JSON.stringify(ack_recieved)+"\r\n")
        }
    })
    clientSocket.on("close", () => {
    console.log("Connection closed by server");
    connectionEstablished=false
    
    });
    clientSocket.on("error", (err) => {
    console.error("Socket error:", err);
    });
})