# Project Proposal

Applied Project: CSG3101.2 
Project proposal 
School of Science, Edith Cowan University 
Supervisor: Mr. Kavindu Yakupitiya 
 
 
Team members : 
# 
Student 
ID 
Name 
Program 
Email 
1 
10659867 
Warnakulasuriya Thushani 
Nathasha Amandi 
Fernando 
 
Bachelor of Computer 
Science majoring software 
WTFERNA0@our.ecu.edu.au 
 
2 
10666034 
Kanishkar Kalasundaram 
Bachelor of Computer 
Science majoring 
Cybersecurity 
Kkalasun@our.ecu.edu.au 
 
3 
10660655 
 
Mohamed Shaheer Afrath 
Mohamed Munafer 
Bachelor of Computer 
Science majoring 
Cybersecurity 
Msmoha23@our.ecu.edu.au 
 
4 
10660177 
Sidharth Krishnakumar 
Bachelor of Computer 
Science majoring software 
SKRISHN7@our.ecu.edu.au 
 
 
5 
10666030 
Harsudhan Arunagirinathan Bachelor of Computer 
Science majoring 
Cybersecurity 
harunagi@our.ecu.edu.au 
 
 
 
 
 
 
 
 
 
 
 

Contents 
Project Goal ....................................................................................................................................... 3 
Project Scope ..................................................................................................................................... 3 
In-Scope .................................................................................................................................... 3 
Out of Scope .............................................................................................................................. 3 
Background ....................................................................................................................................... 3 
Functional and Non-Functional Requirements ..................................................................................... 4 
Functional Requirements............................................................................................................... 4 
Non-Functional Requirements: ...................................................................................................... 5 
Development Methodology ........................................................................................................... 5 
Deliverables ................................................................................................................................ 6 
Project Schedule ................................................................................................................................. 6 
Team Capability Alignment .................................................................................................................. 7 
Tools and Technical requirement ........................................................................................................... 8 
References ..................................................................................................................................... 10 
Appendices .................................................................................................................................... 11 
Gantt Chart ................................................................................................................................. 11 
Work Breakdown Structure ........................................................................................................... 11 
Group Contact ............................................................................................................................. 12 
 
 
 
 
 
 

Smart And Secure Web App for a Cafe 
Project Goal 
To develop a secure, responsive and feature-rich web-based café ordering platform with menu browsing, secure 
payments, a loyalty program and unique features like a chatbot, and staff-managed Crowd Meter. 
Project Scope 
This project aims to develop a secure, responsive, and feature-rich web-based café ordering platform. The 
system will enable customers to browse menus, place orders, make secure payments, and participate in a loyalty 
program. Additional features, such as an integrated chatbot, encrypted message board, and staff-managed 
Crowd Meter, will differentiate the platform from basic ordering systems. A major focus will be placed on 
security to ensure the safe handling of payment and customer data, while maintaining a seamless and enjoyable 
user experience. 
In-Scope 
• Develop a secure, responsive web-based café ordering platform for browsing menus, placing orders, 
making payments, and participating in a loyalty program. 
• Support guest and registered users with real-time order tracking. 
• Staff/admin can manage menu items, orders, users, stock, loyalty points, and crowd levels using the 
same web application (no separate system). 
• Include a chatbot for menu help and order information. 
• Ensure security, responsive design, and deployment on a cloud server. 
Out of Scope 
• The project will not include the development of native mobile applications for iOS or Android. 
• Integration with third-party delivery services is not included. 
• Advanced AI features beyond the chatbot, such as predictive ordering or personalized recommendations, 
will not be implemented. 
• Offline functionality for customers will not be supported. 
• The management of physical hardware, such as POS machines or card terminals, is not part of this 
project. 
Background 
The cafe industry, particularly in Sri Lanka, is increasingly adopting digital platforms to improve efficiency and 
meet rising customer expectations for convenience. Online ordering systems now allow customers to browse 
menus, place orders and pay through their devices, making them an essential part of modern café operations 
(Arora, 2025).However, current cafe ordering platforms face significant shortcomings. Many require account 
creation before purchase, discouraging casual buyers who prefer quick and anonymous transactions. Privacy is 
also a concern, as several platforms collect unnecessary personal details. With over 70% of global consumers 

worried about how their data is stored and used (Smith, 2024), this creates a major barrier to trust. Customer 
engagement remains limited in most existing systems. While loyalty programs are increasingly important, 
participation grew by 28% in 2024 (RestoLabs, 2025), few platforms offer seamless, automatic integration. 
Similarly, many lack real-time customer interaction tools such as chatbots, despite 77% of customers preferring 
automated messaging for quick responses (Team, 2025).One of the main shortcomings of current cafe ordering 
systems is their lack of real-time insight into customer traffic, such as cafe occupancy levels. Without this 
visibility, venues are prone to overcrowding during peak periods, which can lead to longer waiting times and 
diminished customer satisfaction. By leveraging digital occupancy management tools, cafes can monitor crowd 
density, reduce queue lengths, and optimize service, thereby improving both customer experience and 
operational efficiency (Nicholson & Nicholson, 2025). Finally, cybersecurity is a critical weakness. Many café 
ordering platforms rely on weak payment gateways or inadequate encryption, leaving sensitive data at risk of 
breaches and fraud. With digital transactions projected to dominate food and beverage services, secure payment 
handling and compliance with standards such as PCI-DSS (Payment Card Industry Data Security Standard) 
have become essential (Sokolova, 2025). 
Functional and Non-Functional Requirements 
Functional Requirements 
1. The user must be able to navigate the website using a persistent navigation bar containing Home, Menu, 
About, Play Now, Contact and Login/Signup links. 
2. The system must be able to retrieve and display the three trending main items on the Home page, 
including images and associated details. 
3. The user must be able to browse the menu by selecting categories. 
4. The user must be able to expand the menu category to view all items within that category in a full-page 
dropdown. 
5. The user must be able to see the price of each menu item. 
6. The user must be able to add menu items to the cart from any category. 
7. The user must be able to always view the cart through a persistent View Cart option. 
8. The user should be able to interact with a chatbot available on all pages for menu help, order status, 
loyalty points and cafe information. 
9. The user must be able to place an order either as a guest or a registered user. 
10. The user must be able to sign up, login and access a profile dashboard. 
11. The user must be able to view their profile information, edit details, view loyalty points earned and 
check order history. 
12. The system must be able to securely process payments using PayHere and generate a confirmation 
linked to each order. 
13. The system must prompt guest users with a popup to register after their third paid order to access loyalty 
benefits. 
14. The system must automatically update loyalty points for registered users after each qualifying purchase, 
starting from the third paid order. 
15. The system must allow users to optionally apply their loyalty points when checking out. 
16. The user should be able to play a game to win a discount promo code. 

17. The system must automatically display all available discount promo codes to the user during checkout 
and limit one code per order. 
18. The user must be able to see the current cafe crowd levels displayed in a bar chart for different times of 
the day based on the number of orders. 
19. The staff/admin must be able to log in with admin credentials and manage all aspects of the system, 
including menu items, prices, categories, user accounts, loyalty points, and manually update remaining 
stock levels. 
20. The staff/admin must be able to mark orders as “Accepted” when preparation starts and “Done” when 
ready. The system must automatically update the order status in real time so that users can track their 
orders and see “Order is getting prepared” and “Order is ready for pickup.” 
21. The staff/admin must be able to verify payment confirmations and handle failed transactions, ensuring 
that all changes are reflected in the system in real time. 
22. The staff/admin must be able to manage cafe crowd levels, and the system must display updated 
occupancy information in real time for users. 
23. The staff/admin must be able to create an order in the system on behalf of a customer (physical/phone 
walk-in) using the same order flow as a user. 
24. The user should be able to contact the staff using a contact form by entering their details and message. 
Non-Functional Requirements: 
1. The system must be responsive to desktops, tablets, and mobile. 
2. The system should maintain high availability during café hours. 
3. The system must use strong encryption to protect customers and payment data. 
4. The system should handle peak hours without performance issues. 
5. The system must follow secure coding standards and PCI-DSS requirements. 
6. The system should respond to user actions within 2–3 seconds (normal) and 5 seconds (peak). 
7. The system must ensure data consistency and prevent loss of orders or loyalty points. 
8. The system should have modular, well-documented code for easy updates. 
9. The system must provide an intuitive interface with clear navigation. 
10. The system should follow accessibility standards (keyboard, contrast, screen reader). 
11. The system could support multiple languages or currency/date formats. 
12. The system must log user actions, errors, and transactions for audits. 
13. The system must include daily database backups and a recovery plan. 
14. The system should allow integration with analytics, marketing, or payment services. 
Development Methodology 
The project will follow an Agile methodology with iterative development cycles, allowing flexibility and 
continuous improvement throughout the development process: 
• Planning & Requirement Gathering: Define project scope, assign roles, and set timelines. 
• Design Phase: Create the system architecture, database schema, and wireframes for the platform. 
• Implementation: Develop features incrementally in sprints, focusing on core functionalities first (e.g., 
order placement, payment integration). 
• Testing: Conduct unit, integration and security testing at the end of each sprint to ensure quality and 
security. 

• Deployment & Review: Finalize deployment to production, demonstrate to stakeholders, and gather 
feedback for improvements. 
 
Deliverables 
Deliverable 
Description 
Deliverable Format 
Project 
Proposal 
Finalized project proposal with supervisor's approval. 
PDF 
Final 
Executable 
A fully functional web application that runs on desktops, 
tablets, and mobile devices. 
Web Application (hosted on 
AWS/EC2) 
Source Code 
Complete source code, hosted on a Git repository. 
GitHub Repository (URL link) 
User Guide 
A comprehensive manual detailing installation, usage, 
and troubleshooting. 
PDF 
Developer 
Manual 
Technical documentation, including system architecture, 
API integration details, and setup instructions. 
PDF / Markdown / GitHub Wiki 
Testing and 
Evaluation 
Report 
A summary of test cases, methodologies, results and 
identified issues during testing. 
PDF / Word Document 
Final 
Presentation 
A presentation summarizing project objectives, 
methodology, features, testing outcomes and deliverable 
status. 
PowerPoint (PPTX) / PDF 
Table 1 : Deliverables 
Project Schedule 
The project will be developed over a 12-week period with clearly defined milestones for each phase of the 
project. The schedule is based on an Agile methodology to allow iterative development, flexibility, and 
continuous feedback from both the team and the supervisor. This approach ensures we can adapt to changing 
requirements, focus on core features first, and have enough time for thorough testing. 
Task 
ID 
Assigned 
Person 
Task / Milestone 
Details 
Deliverables / Evaluation Points 
1 
Shaheer 
 
Project Initiation & 
Planning 
Finalizing the project 
scope, WBS, team roles, 
and timelines. 
Submit initial project proposal, 
WBS, Gantt chart for review by 
supervisor. 
2 
Shaheer 
Requirement Analysis 
& Research 
Research café ordering 
systems, secure payment 
gateways, loyalty 
program, chatbot 
frameworks. 
Requirements gathering and 
approval from supervisor. 
3 
Nathasha 
System Design 
(Architecture, ERD, 
UI/UX) 
Create system 
architecture, database 
schema, and wireframes.  
System architecture diagram, ERD, 
and wireframes for review. 
4 
Sidharth  
Backend 
Development (Core 
Features) 
Develop APIs for order 
placement, payment, and 
token tracking. 
Backend functionality for orders, 
payments, and token tracking. 
5 
Nathasha  
Frontend 
Development 
(Customer UI, 
Build the customer-facing 
UI, order tracking, staff 
dashboards. 
Customer UI, order placement, 
staff/admin dashboards for internal 
review. 

Staff/Admin 
Dashboards) 
6 
 
Kanishkar  Security 
Implementation 
(Token security, 
RBAC, Payment 
Gateway Integration) 
Integrate secure payment 
systems and implement 
token security. 
Payment system integration and 
security features tested internally. 
7 
Harsudhan 
 
Testing & Final 
Revisions 
Unit, integration, and 
security testing on the app. 
Final revisions based on test 
results. 
8 
Harsudhan 
 
Deployment & Final 
Review 
Prepare for deployment, 
perform final testing and 
review. 
Final deployment and project 
handover for final supervisor 
evaluation. 
9 
Kanishkar 
 
Documentation and 
Handover 
Prepare and finalize all 
project documentation, 
including technical 
documentation, user 
manual, GitHub 
repository, and final 
submission package. 
Conduct a final 
supervision meeting to 
review and approve 
deliverables. 
Technical documentation, user 
documentation, final submission 
package (Google Docs/MS Word), 
updated GitHub repository, and 
supervisor’s approval. 
Table 2 : Project Schedule 
Team Capability Alignment 
Our team brings a diverse mix of technical expertise, ensuring every aspect of the project is addressed with the 
appropriate skills. The breakdown of our team’s roles ensures that we are covered in the essential areas: 
Cybersecurity Expertise: Shaheer, Harsudhan and Kanishkar, with their deep knowledge of cybersecurity, will 
handle securing the application, ensuring sensitive customer data, including payment details, are properly 
protected. 
Software Development & UI/UX Design: Sidharth and Nathasha, with their experience in programming and 
UI/UX design, will be responsible for developing the core features, ensuring smooth functionality and creating 
a user-friendly interface. 
The team will work collaboratively throughout the project, leveraging each other’s strengths in security, 
performance, and user experience, while also learning from each other to improve our development process. 
Team 
Member 
Role 
Task Name 
Discipline 
 
Key Responsibilities 
Task 
 
Nathasha 
Frontend 
Developer, 
UI/UX, 
Database 
Develop 
customer-facing 
UI- Design 
responsive 
layouts- Help 
with database 
design and 
integration 
Software 
Engineering 
 Focus on UI/UX 
design and front-end 
development. 
Assist in designing 
and integrating the 
database. 
5.1 
5.2, 5.2.1 
5.3, 5.3.1, 5.3.2 
5.4, 5.5 

Sidharth 
Backend 
Developer, 
Frontend 
Assistant, 
Database 
Backend 
development- 
Assist in frontend 
development- 
Help with 
database 
integration 
Software 
Engineering 
Handle backend 
functionality. 
Assist with frontend 
development and 
database 
implementation. 
4.1 
4.2 
4.3 
4.4, 4.4.1, 4.4.2, 
4.4.3, 4.4.4 
4.5, 4.5.1, 4.5.2 
4.6 
Kanishkar 
Backend 
Developer, 
Security, 
Database 
Develop backend 
features- 
Implement 
security features- 
Work on database 
design and 
implementation 
Cybersecurity  Focus on backend 
development and 
database. 
Implement security 
measures and ensure 
database security. 
6.1, 6.2, 6.3, 6.4, 6.5, 
6.6, 6.7, 6.8 
9.1, 9.2, 9.3, 9.4 
Shaheer 
Backend 
Developer, 
Security, 
Database 
Backend 
development- 
Implement 
security features- 
Work on database 
management and 
performance 
Cybersecurity  Focus on backend 
logic. 
Oversee security 
implementation and 
database 
management. 
1.1, 1.1.1, 1.1.2, 
1.1.3, 1.1.4 
1.2, 1.2.1, 1.2.1.1, 
1.2.1.2, 1.2.2, 1.2.3 
1.3, 1.3.1, 1.3.2, 
1.3.3, 1.4 
2.1, 2.1.1, 2.1.2, 
2.1.3, 2.1.4, 2.1.5, 
2.1.6, 2.2, 2.2.1, 
2.2.2 
Harsudhan Backend 
Developer, 
Security, 
Database 
Backend 
development- 
Oversee security 
protocols- Handle 
database-related 
tasks 
Cybersecurity  Manage backend 
functionality. 
Implement security 
features and 
optimize database 
performance. 
7,  
8.1, 8.2, 8.3, 8.4 
Table 3 : Team Capability Alignment 
Tools and Technical requirement  
Category 
Tool / Software 
Purpose 
Access Method 
Frontend 
Development 
React,CSS, React Router, 
Vite, npm 
Build customer UI (Home, 
Menu, About, Contact, Play 
Now), cart, order tracking; 
manage routing and styling; 
enable responsive design and 
fast bundling. 
Install via npm (react, react-
router-dom, css, vite) 
Backend 
Development 
Python, Django, Django 
REST Framework (DRF) 
Provide REST APIs for menu, 
orders (guest + registered), 
loyalty program, payments 
(via webhooks), crowd meter, 
message board, and chatbot 
integration. 
Free, install via pip (django, 
djangorestframework) 
Authentication 
Django Authentication  
Secure user sign-up, login, 
password reset on the 
frontend; token verification 
and role checks on backend. 
Built-in Django 
Authentication system 

Database 
MySQL (local/dev),  AWS 
RDS MySQL (prod) 
Store user profiles (by 
Firebase UID), orders, menu 
items, loyalty points, staff 
schedules, and message board 
data. 
Install MySQL locally; 
migrate via Django ORM; 
deploy to AWS RDS for 
production 
Payment 
Integration 
PayHere  
Enable secure online 
payments; process 
transactions and confirm 
orders via webhook 
notifications. 
Sign up for merchant 
account; obtain API keys 
from PayHere 
Security 
Zod, Validator.js, 
Django/DRF serializers, 
Casbin (optional), nanoid, 
HMAC (Python), express-
rate-limit, dotenv + AWS 
Secrets Manager 
Input validation & 
sanitization, role-based access 
control (RBAC), secure order 
token generation, webhook 
signature verification, rate 
limiting, and secure storage of 
secrets/keys. 
Free, open-source (npm, 
pip); AWS Secrets Manager 
for production 
DevOps / 
Hosting 
AWS (EC2) 
 
Hosting the app, setting up 
SSL, and reverse proxy 
configuration 
AWS free tier for EC2, Let’s 
Encrypt for SSL certs 
Testing 
Pytest 
Unit testing, API testing, and 
security vulnerability scanning 
Free, open-source, install via 
pip / use Postman web 
platform 
UI / UX 
Design 
Figma, draw.io 
Wireframing, system design, 
and UI mockups 
Free version available for 
Figma / free for draw.io 
Collaboration 
Tools 
GitHub 
Version control and team 
collaboration 
Free personal account 
Table 4 : Tools and Technical requirement 
 
 
 
 
 
 
 
 
 
 
 
 
 

References  
Arora, R. (2025, May 26). Restaurant Statistics Sri Lanka – Industry Data, Growth Trends & Dining Behavior. 
Restroworks Blog. https://www.restroworks.com/blog/restaurant-statistics-sri-lanka/? 
Natalie Sokolova. (2025, January 31). Restaurant and retail tech trends 2025 to improve customer experience, 
process automation and security | dev.family. Dev.family. https://dev.family/blog/article/restaurant-and-retail-
tech-trends-2025-to-improve-customer-experience-process-automation-and-security 
Nicholson, B., & Nicholson, B. (2025, February 11). Abakus Analytics. Abakus Analytics. 
https://www.abakusanalytics.com/how-real-time-occupancy-management-reduces-queue-wait-times/? 
RestoLabs. (2025, July 18). Restolabs.com. https://www.restolabs.com/blog/restaurant-online-ordering-
statistics? 
Smith, G. (2024, December 30). 80+ Top Data Privacy Statistics for 2025. StationX. 
https://www.stationx.net/data-privacy-statistics/? 
Team, E. (2025, July 15). Hospitality Statistics: Industry Trends and Data for 2025. Escoffier; Auguste 
Escoffier School of Culinary Arts. https://www.escoffier.edu/blog/world-food-drink/hospitality-industry-trends-
and-statistics/? 
 
 
 

Appendices 
Gantt Chart 
 
 
Work Breakdown Structure 
WBS link - https://edithcowanuni-
my.sharepoint.com/:x:/g/personal/wtferna0_our_ecu_edu_au/EeeAnsCG3etAizqKhUxqieABbjd0HvUFEk
8HcDvQf_jfcg?e=V3CpmN&wdOrigin=TEAMS-MAGLEV.p2p_ns.rwc&wdExp=TEAMS-
TREATMENT&wdhostclicktime=1755510455542&web=1 
 
 
 

Group Contact  
Group Contract for CSG3101 Applied Project  
Group norms are the rules that define acceptable behaviour amongst members of a group. Norms include levels 
of performance valued by the group, expectations of group members, beliefs and values in relation to study, 
relationships between group members and teamwork within the group. Writing down these agreed norms in the 
form of a Group Contract provides a means of clarifying and enforcing these norms when necessary. This 
generally leads to higher levels of commitment to group goals and better group performance. It can also reduce 
the chances of the free-rider emerging within the group which can be distressing for all group members, 
particularly responsible group members who do their fair share of the work. A Group Contract is a requirement 
of this unit and must be submitted in your first Project Management Report complete with all signatures. A sample 
of the Group Contract is included below which must be modified according to your group’s needs. Expulsion of 
a Group Member: In cases where one or more members act contrary to the objectives of the whole group a 
method of dispute resolution (and in some cases expulsion) must be included in the contract. In the event that the 
majority of a group wishes to expel a group member, they must show clearly the number of opportunities that the 
member in question has received to remedy a situation. This must be verifiable and auditable (note verbal 
acknowledgment is insufficient). There must be a minimum of three occasions where a group member has been 
notified of his/her inappropriate performance, and the issues should be clearly documented in previous weekly 
progress reports showing both a member’s poor performance AND the means by which this was professionally 
communicated within the group.  
Group Contract 
1. The subject matter of this contract  
 
This contract is entered into by the students named below for the purpose of ensuring that each individual group 
member fulfills his/her obligations for completing the group assignment for the unit CSG3101 Applied Project.  
2. The consideration  
 
1. All group members will be punctual at meetings. 
2. All group members should attend meetings unless by prior agreement with the group.  
3. All group members will stay at the meeting until it is agreed that the meeting is adjourned.  
4. All group members will agree to a specific day/time for each weekly meeting and an agreed 
procedure for informing all other members prior to any missed meetings.  
5. All group members will come to the meetings prepared by completing the agreed tasks on time.  
6. The group will actively seek the contributions and opinions of each member at meetings and during 
group discussions.  

7. Each group member will take turns at both listening and talking.  
8. Dominating the group’s discussion and decision making is not acceptable.  
9. Group members will take turns in writing down minutes of the meeting.  
10. The group member taking minutes will record allocated tasks to be completed by group members by 
name and agreed deadlines for task completion.  
11. The group members must decide and declare which method of communication is to be the preferred 
and agreed method (i.e., MS Teams, ECU email, face-to-face.  
12. The group members must decide on an auditable and verifiable method of detailing completed tasks 
and or individual elements. (i.e., Google groups, tasks management, written master file)  
13. Work allocation will be according to an agreed procedure and is documented below (insert method 
of breaking down the assignment and allocation of work to group members).  
14. Where disputes arise regarding the work tasks or agreed behaviours in which a group member is not 
performing according to the terms of this agreement, the following process will be entered into to 
resolve the dispute: (insert the dispute resolution procedure for your group). Disputes must be 
resolved within the group and documentation must  
be retained that relates to attempts to resolve a dispute or to encourage a group member to make his or 
her contribution to the assignment).  
15. Ejection of a non-performing or disruptive group member. The Contract  
MUST include a specific method for dealing with group members where the performance of the group is 
affected.  
3. Names and signatures of the parties to this Group Contract  
 
 
 
Student signature   
Student name 
( printed )   
Student 
Number   
Date   
Warnakulasuriya 
Thushani Nathasha 
Amandi Fernando   
Kanishkar   
Kalasundaram   
Mohamed Shaheer   
Afrath Mohamed   
Munafer   
Harsudhan   
Arunagirinathan   
  
10659867   
  
10666034   
  
10660655   
  
10660177   
  
10666030   
  
19/08/2025   
  
19/08/2025   
  
19/08/2025   
  
19/08/2025   
  
19/08/2025   
Sidharth   
Krishnakumar   

Date of Fully Signed copy given to Supervisor and Unit Coordinator 
  
_____19/08/2025____________  
 

