# Computer Networks MCQs for Placement Preparation

**Level:** Beginner to intermediate, with a few interview-style questions  
**Questions:** 60  
**Format:** Single correct answer per question

Use this as a practice set: attempt the questions first, then check the answer key and explanations at the end.

---

## Section 1: Networking Fundamentals and Models

### 1. Which layer of the OSI model is responsible for end-to-end delivery, segmentation, and flow control?
A. Network layer  
B. Transport layer  
C. Session layer  
D. Data Link layer

### 2. Which OSI layer is primarily responsible for logical addressing and routing packets between networks?
A. Physical layer  
B. Data Link layer  
C. Network layer  
D. Presentation layer

### 3. Which device traditionally operates at the Data Link layer and forwards frames using MAC addresses?
A. Hub  
B. Switch  
C. Router  
D. Repeater

### 4. What is the Protocol Data Unit (PDU) commonly called at the Transport layer?
A. Bit  
B. Frame  
C. Packet  
D. Segment

### 5. Which of the following is the correct order of OSI layers from Layer 1 to Layer 7?
A. Physical, Data Link, Network, Transport, Session, Presentation, Application  
B. Physical, Network, Data Link, Transport, Presentation, Session, Application  
C. Application, Presentation, Session, Transport, Network, Data Link, Physical  
D. Physical, Data Link, Transport, Network, Session, Application, Presentation

### 6. Which statement best describes encapsulation?
A. Removing headers as data reaches the sender  
B. Adding protocol headers (and sometimes trailers) as data moves down the network stack  
C. Encrypting every packet automatically  
D. Converting an IP address into a MAC address

### 7. Which topology connects every node to a central device?
A. Bus  
B. Ring  
C. Star  
D. Mesh

### 8. What is the main purpose of a default gateway on a host?
A. Resolve domain names  
B. Forward traffic destined for networks outside the local subnet  
C. Assign a MAC address to the host  
D. Encrypt local network traffic

## Section 2: TCP, UDP, and Ports

### 9. Which protocol provides reliable, connection-oriented byte-stream delivery?
A. UDP  
B. IP  
C. TCP  
D. ARP

### 10. Which protocol is usually preferred for real-time voice or video when low latency is more important than retransmitting every lost packet?
A. TCP  
B. UDP  
C. FTP  
D. SMTP

### 11. How many steps are in the standard TCP connection-establishment handshake?
A. One  
B. Two  
C. Three  
D. Four

### 12. Which sequence correctly represents the TCP three-way handshake?
A. ACK → SYN → FIN  
B. SYN → SYN-ACK → ACK  
C. SYN-ACK → FIN → ACK  
D. FIN → FIN-ACK → ACK

### 13. Which TCP mechanism helps prevent a fast sender from overwhelming a slow receiver?
A. DNS resolution  
B. Flow control using the receive window  
C. IP fragmentation  
D. ARP caching

### 14. What does TCP congestion control primarily attempt to avoid?
A. Domain-name duplication  
B. Overloading the network with excessive traffic  
C. MAC address conflicts  
D. Incorrect subnet masks

### 15. Which port is the default port for HTTPS?
A. 21  
B. 25  
C. 80  
D. 443

### 16. Which service commonly uses TCP port 22?
A. SSH  
B. DNS  
C. DHCP  
D. POP3

### 17. Which port is commonly associated with DNS queries?
A. 23  
B. 53  
C. 110  
D. 143

### 18. Which protocol is commonly used to send email between mail servers?
A. SMTP  
B. IMAP  
C. SNMP  
D. DHCP

## Section 3: IP Addressing and Subnetting

### 19. How many bits are in an IPv4 address?
A. 16  
B. 32  
C. 64  
D. 128

### 20. How many bits are in an IPv6 address?
A. 32  
B. 64  
C. 96  
D. 128

### 21. Which of the following is a private IPv4 address?
A. 8.8.8.8  
B. 172.20.5.4  
C. 1.1.1.1  
D. 203.0.113.10

### 22. What is the IPv4 loopback address most commonly used to refer to the local machine?
A. 0.0.0.0  
B. 127.0.0.1  
C. 255.255.255.255  
D. 192.168.0.1

### 23. What does the subnet mask 255.255.255.0 correspond to in CIDR notation?
A. /8  
B. /16  
C. /24  
D. /32

### 24. A subnet with a /26 prefix contains how many total IPv4 addresses?
A. 16  
B. 32  
C. 64  
D. 128

### 25. In a conventional IPv4 subnet with a /27 prefix, how many usable host addresses are available?
A. 14  
B. 30  
C. 32  
D. 62

### 26. Which address is the network address for 192.168.10.77/24?
A. 192.168.10.0  
B. 192.168.10.1  
C. 192.168.10.77  
D. 192.168.10.255

### 27. Which address is the broadcast address for 192.168.5.64/26?
A. 192.168.5.95  
B. 192.168.5.127  
C. 192.168.5.191  
D. 192.168.5.255

### 28. What is the main purpose of NAT in many IPv4 networks?
A. Translate private addresses to public addresses (and track mappings)  
B. Translate domain names into IP addresses  
C. Detect transmission errors in Ethernet frames  
D. Replace TCP with UDP

## Section 4: Common Protocols and Services

### 29. What is the primary function of DNS?
A. Automatically allocate IP addresses  
B. Translate domain names into records such as IP addresses  
C. Encrypt web traffic  
D. Route packets between autonomous systems

### 30. Which protocol automatically leases IP configuration such as an IP address, subnet mask, and default gateway to clients?
A. DHCP  
B. FTP  
C. ARP  
D. ICMP

### 31. Which protocol maps an IPv4 address to a MAC address on a local network?
A. DNS  
B. ARP  
C. TLS  
D. BGP

### 32. Which protocol is commonly used by the `ping` utility?
A. ICMP  
B. SMTP  
C. SSH  
D. NTP

### 33. What is the main purpose of TLS in HTTPS?
A. Assign IP addresses to clients  
B. Provide encryption and integrity, and authenticate the server using certificates  
C. Select the best route between routers  
D. Convert MAC addresses to domain names

### 34. Which protocol is commonly used to securely transfer files over an SSH connection?
A. TFTP  
B. SFTP  
C. HTTP  
D. SNMP

### 35. Which DNS record type identifies the mail server for a domain?
A. MX  
B. AAAA  
C. CNAME  
D. PTR

### 36. Which protocol is commonly used to synchronize clocks across networked systems?
A. NTP  
B. FTP  
C. ARP  
D. POP3

## Section 5: Switching, Routing, and Network Design

### 37. A router generally makes forwarding decisions based on which information?
A. Destination IP address and routing table  
B. Destination application name only  
C. Source process ID  
D. HTTP page title

### 38. What is the purpose of a routing protocol?
A. Assign MAC addresses to network cards  
B. Exchange reachability information and help routers build routing tables  
C. Encrypt every Ethernet frame  
D. Allocate memory to client applications

### 39. Which routing protocol is commonly used to exchange routing information between autonomous systems on the Internet?
A. RIP  
B. OSPF  
C. BGP  
D. ARP

### 40. Which statement about OSPF is correct?
A. It is a link-state interior gateway routing protocol  
B. It is an email transfer protocol  
C. It resolves hostnames  
D. It operates only as a transport-layer protocol

### 41. What problem does Spanning Tree Protocol (STP) help prevent in Layer 2 switched networks?
A. DNS cache poisoning  
B. Switching loops  
C. IP address exhaustion  
D. Weak TLS certificates

### 42. What is a VLAN primarily used for?
A. Logically segmenting a Layer 2 network  
B. Increasing an IPv4 address from 32 bits to 64 bits  
C. Replacing all routers with hubs  
D. Encrypting wireless traffic automatically

### 43. What does a switch typically do when it receives a frame whose destination MAC address is unknown?
A. Drops it in every case  
B. Sends it only to the router  
C. Floods it out eligible ports in the same VLAN, except the incoming port  
D. Converts it into an IP packet

### 44. Which metric does RIP traditionally use to select routes?
A. Hop count  
B. CPU temperature  
C. Domain-name length  
D. TCP window size

## Section 6: Wireless Networking and Security

### 45. What does WPA2/WPA3 primarily protect in a Wi-Fi network?
A. Wireless communication using authentication and encryption mechanisms  
B. Public DNS records  
C. Fiber-optic cables  
D. The physical security of a router

### 46. What is a major risk of connecting to an untrusted public Wi-Fi network?
A. The device's IPv4 address becomes 128 bits  
B. Traffic or connections may be monitored or attacked, especially without proper encryption and certificate validation  
C. TCP stops supporting acknowledgments  
D. DNS is permanently disabled

### 47. Which attack attempts to overwhelm a service with traffic from many distributed systems?
A. DDoS  
B. ARP resolution  
C. NAT traversal  
D. DHCP leasing

### 48. What is ARP spoofing (ARP poisoning)?
A. Sending forged ARP messages to associate an IP address with an attacker's MAC address  
B. Encrypting DNS traffic with TLS  
C. Assigning a valid subnet mask  
D. Creating a redundant route with OSPF

### 49. Which measure most directly reduces the risk of unauthorized remote administration of a router?
A. Enable Telnet on every interface  
B. Use strong authentication, restrict management access, and prefer SSH over Telnet  
C. Disable all logging  
D. Publish the administrator password

### 50. What is the principle of least privilege?
A. Give every user administrator access  
B. Grant only the permissions required to perform a role or task  
C. Disable authentication for internal users  
D. Keep all ports open for convenience

## Section 7: Troubleshooting and Applied Scenarios

### 51. A user can access a website by its IP address but not by its domain name. Which service should you investigate first?
A. DNS  
B. STP  
C. NTP  
D. SSH

### 52. A Windows computer has an IPv4 address in the 169.254.0.0/16 range. What is a likely explanation?
A. It successfully received a public IP from a global provider  
B. It self-assigned a link-local address, often because DHCP was unavailable  
C. It is using an IPv6-only address  
D. It has necessarily been infected with malware

### 53. Which command-line utility is commonly used to display the route packets take toward a destination?
A. `tracert` on Windows or `traceroute` on many Unix-like systems  
B. `mkdir`  
C. `format`  
D. `whoami`

### 54. Which command on Windows displays the current IP configuration, including the default gateway?
A. `ipconfig`  
B. `nslookup`  
C. `net user`  
D. `tasklist`

### 55. A host can communicate with devices on its local subnet but cannot reach remote networks. Which configuration should be checked early?
A. Default gateway  
B. Monitor refresh rate  
C. Keyboard layout  
D. File extension settings

### 56. What does a successful `ping 127.0.0.1` primarily verify?
A. End-to-end Internet connectivity  
B. Basic local TCP/IP loopback functionality  
C. DNS resolution by a public server  
D. That the default gateway is reachable

### 57. Which tool is most appropriate for querying DNS records interactively from a terminal?
A. `nslookup`  
B. `diskpart`  
C. `chmod`  
D. `ping` only

### 58. A TCP connection succeeds, but an application request fails. What is the best next interpretation?
A. The network must be completely disconnected  
B. Basic transport connectivity exists, but the issue may be at the application layer or in application-specific configuration  
C. The MAC address must be invalid  
D. DNS is always the cause

### 59. What is the purpose of a packet analyzer such as Wireshark?
A. Capture and inspect network packets for troubleshooting and analysis  
B. Automatically replace a router's firmware  
C. Increase the bandwidth of a link physically  
D. Assign public IP addresses from an ISP

### 60. A network link has a bandwidth of 100 Mbps. Ignoring overhead and other bottlenecks, what is the maximum theoretical transfer rate in megabytes per second (MB/s)?
A. 1.25 MB/s  
B. 8 MB/s  
C. 12.5 MB/s  
D. 100 MB/s

---

# Answer Key with Brief Explanations

| Q | Answer | Explanation |
|---:|:---:|---|
| 1 | B | TCP and UDP operate at the Transport layer; TCP provides segmentation, reliability, and flow control. |
| 2 | C | The Network layer handles logical addressing and routing between networks. |
| 3 | B | A Layer 2 switch forwards Ethernet frames using its MAC address table. |
| 4 | D | A common name for a Transport-layer PDU is a segment for TCP; UDP is often called a datagram. |
| 5 | A | This is the OSI layer order from Physical (1) through Application (7). |
| 6 | B | Encapsulation adds headers, and sometimes trailers, as data moves down the protocol stack. |
| 7 | C | In a star topology, nodes connect to a central switch or hub. |
| 8 | B | The default gateway forwards traffic when the destination is outside the local subnet. |
| 9 | C | TCP is connection-oriented and provides reliable, ordered byte-stream delivery. |
| 10 | B | UDP avoids TCP's retransmission and ordering overhead, making it useful for latency-sensitive media. |
| 11 | C | TCP normally establishes a connection with three messages. |
| 12 | B | The standard sequence is SYN, SYN-ACK, then ACK. |
| 13 | B | TCP's receive window communicates how much data the receiver can accept. |
| 14 | B | Congestion control adapts sending behavior to reduce network overload. |
| 15 | D | HTTPS conventionally uses TCP port 443, though HTTP/3 uses QUIC over UDP. |
| 16 | A | SSH conventionally listens on TCP port 22. |
| 17 | B | DNS commonly uses port 53 over UDP and TCP. |
| 18 | A | SMTP is used to submit and relay email; IMAP and POP3 are used for mail access. |
| 19 | B | IPv4 addresses contain 32 bits. |
| 20 | D | IPv6 addresses contain 128 bits. |
| 21 | B | 172.16.0.0–172.31.255.255 is one of the RFC 1918 private IPv4 ranges. |
| 22 | B | 127.0.0.1 is the commonly used IPv4 loopback address. |
| 23 | C | A /24 prefix represents 24 network bits and mask 255.255.255.0. |
| 24 | C | A /26 leaves 6 host bits, so it has 2^6 = 64 total addresses. |
| 25 | B | A /27 has 32 total addresses; conventionally 30 are usable after network and broadcast addresses. |
| 26 | A | With /24, the first three octets identify the subnet; the network address ends in .0. |
| 27 | B | A /26 block has 64 addresses; the block starting at .64 ends at .127. |
| 28 | A | NAT translates addresses between networks, commonly allowing multiple private hosts to share a public IPv4 address. |
| 29 | B | DNS resolves names to records, including A and AAAA address records. |
| 30 | A | DHCP leases IP settings to clients. |
| 31 | B | ARP resolves a known IPv4 address to a link-layer MAC address on a local IPv4 network. |
| 32 | A | `ping` typically uses ICMP Echo Request and Echo Reply messages. |
| 33 | B | TLS provides confidentiality and integrity and can authenticate a server via certificates. |
| 34 | B | SFTP transfers files over SSH; it is different from FTP and FTPS. |
| 35 | A | MX records identify mail exchangers for a domain. |
| 36 | A | NTP synchronizes clocks among networked systems. |
| 37 | A | Routers perform forwarding based primarily on destination IP and the routing table. |
| 38 | B | Routing protocols exchange route information so routers can determine reachable networks and paths. |
| 39 | C | BGP exchanges routing information between autonomous systems. |
| 40 | A | OSPF is a link-state interior gateway protocol. |
| 41 | B | STP blocks selected Layer 2 paths to prevent switching loops. |
| 42 | A | VLANs create logical Layer 2 segments, typically separating broadcast domains. |
| 43 | C | Unknown unicast frames are generally flooded within the VLAN, excluding the ingress port. |
| 44 | A | RIP uses hop count, with 15 as the maximum usable hop distance. |
| 45 | A | WPA2/WPA3 secure Wi-Fi access and wireless communications using authentication and encryption. |
| 46 | B | Untrusted networks can expose users to malicious access points, traffic interception, or other attacks. HTTPS validation remains important. |
| 47 | A | A distributed denial-of-service attack uses many sources to overwhelm a target. |
| 48 | A | ARP spoofing uses forged ARP messages to mislead local devices about IP-to-MAC mappings. |
| 49 | B | Strong authentication, access restrictions, and SSH reduce management-plane exposure. |
| 50 | B | Least privilege grants only the permissions needed for the task. |
| 51 | A | If IP access works but names fail, DNS resolution is a primary suspect. |
| 52 | B | Windows may assign an APIPA/link-local address when DHCP configuration cannot be obtained. |
| 53 | A | `tracert`/`traceroute` helps reveal hops along a path, subject to network filtering. |
| 54 | A | `ipconfig` displays Windows IP configuration, including gateway information. |
| 55 | A | Local connectivity with remote failure often warrants checking the default gateway and routes. |
| 56 | B | Loopback ping tests local TCP/IP processing; it does not test the physical network or Internet. |
| 57 | A | `nslookup` queries DNS and can inspect name-resolution behavior. |
| 58 | B | A successful TCP connection does not guarantee that the application protocol or request will succeed. |
| 59 | A | Wireshark captures and decodes packets for network diagnostics and protocol analysis. |
| 60 | C | Divide bits per second by 8: 100 Mbps ÷ 8 = 12.5 MB/s, before overhead. |

---

## Suggested Placement Practice Plan

1. **Round 1 — Fundamentals:** Questions 1–18. Target: 12 minutes.
2. **Round 2 — Addressing and protocols:** Questions 19–36. Target: 15 minutes; practise subnet calculations on paper.
3. **Round 3 — Routing, security, and troubleshooting:** Questions 37–60. Target: 20 minutes.
4. **Review:** Reattempt every incorrect question without checking the answer key. For subnetting, be able to explain the number of host bits, total addresses, usable hosts, network address, and broadcast address.

**Note:** Port numbers are conventional defaults; services can be configured to use non-default ports. Subnetting answers assume conventional IPv4 subnets where the network and broadcast addresses are not assigned to hosts.
