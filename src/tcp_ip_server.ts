
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
    
let ack_counter=0
    let syn_counter=0
    let ack_recieved=false
    let packets:Packet[]=[]
    let last_packet:Packet | null = null
    let packet_timeout_map=new Map<number,NodeJS.Timeout>()

function cleanUpClient(){
    for(const values in packet_timeout_map.values()){
        clearTimeout(values)
    }
    //cleared timeout as well as acks
    packet_timeout_map.clear()
    ack_recieved=false
    last_packet=null
    console.log(`Clean up client called`);
}

const server=net.createServer(socket=>{
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
            const timeout=setTimeout(()=>{
                if(!ack_recieved && last_packet){
                    socket.write(JSON.stringify(last_packet)+'\r\n')
                }
            },6000)
            //setting the timeout with ack
            packet_timeout_map.set(last_packet.ack,timeout)
            
            ack_counter++
            syn_counter++
        }
           if(message.type==="ack"){
                const ack=message.ack_number
                const timeout=packet_timeout_map.get(ack)
                if(timeout){
                    clearTimeout(timeout)
                    console.log(`ack_recieved:${ack} timeout cleared`);
                }else{
                    console.log(`Unknown ack_recieved:${ack}`);
                }
                ack_recieved=true
           }


    })
    socket.on("end",()=>{
        console.log("Client Disconnected")
        cleanUpClient()
    })

    socket.on("error",(err)=>{
        console.log(err)
        cleanUpClient()
    })
})
 


server.listen(PORT,()=>console.log("TCP server running on the PORT 4000"))
