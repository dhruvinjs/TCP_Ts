
import * as net from "net"
import path from "path"
// import NodeJs from "node"
const PORT=4000
type Packet ={
    type:'data',
    syn:number,
    ack:number,
    payload:string,
    checksum:string
}
const server=net.createServer(socket=>{
    let ack_counter=0
    let syn_counter=0
    let ack_recieved=false
    let packets:Packet[]=[]
    let last_packet:Packet | null = null
    let timeout:NodeJS.Timeout | null = null  
    console.log("Client connected")

    socket.setEncoding("utf-8")
    //3-way handshake simulation
    socket.setTimeout(5000,()=>{
        const syn_message={
            type:"SYN",
            message:"Hey can we connect"
        }
        socket.write(JSON.stringify(syn_message)+'\r\n')
    })
    
    socket.on("data",(data:string)=>{
        const trimmed=data.trim()
        if (!trimmed) return;

        let message;
        try {
            message = JSON.parse(trimmed);
        } catch (error) {
            console.error("Invalid JSON received:", data);
            socket.write(JSON.stringify({ type: "error", message: "Invalid JSON format" }) + '\r\n');
            return;
        }
        if(message.type==="SYN_ACK"){
            const ack_message={
                type:"ACK",
                message:"Connected Successfully"
            }
            socket.write(JSON.stringify(ack_message)+'\r\n')
            return
        }
        if(message.type==="conversation"){
            const packet:Packet={
                type:"data",
                ack:ack_counter+1,
                syn:syn_counter+1,
                checksum:crypto.randomUUID(),
                payload:"hello there"
            }
            packets.push(packet)
            last_packet=packet
            socket.write(JSON.stringify(packet)+'\r\n')
            ack_recieved=false
            ack_counter++
            syn_counter++

            //clearing the old timeout and setting it new
            if(timeout) clearTimeout(timeout)
            timeout=setTimeout(()=>{
                if(!ack_recieved && last_packet){
                    console.log("sending packet again")
                    socket.write(JSON.stringify(last_packet)+'\r\n')
                }
            },5000)
        }

        if(message.type==="ack"){
            const ack_number=message.ack_number
            if(ack_number === last_packet?.ack){
                ack_recieved=true
                console.log("ack_recieved successfully");
                if(timeout) clearTimeout(timeout)
            }
            else{
                ack_recieved=false
                if(timeout)clearTimeout(timeout)
                timeout=setTimeout(()=>{
                    console.log("wrong ack")
                if(!ack_recieved && last_packet){
                    const wrong_ack_message={
                        type:"WRONG ACK_RECIEVED",
                        message:"Sending the packet again"
                    }
                     socket.write(JSON.stringify(wrong_ack_message)+'\r\n')
                     socket.write(JSON.stringify(last_packet)+"\r\n")   
                }
                },2000)
            }
        }


    })
    socket.on("end",()=>console.log("Client Disconnected"))
})
 


server.listen(PORT,()=>console.log("TCP server running on the PORT 4000"))
