int led = 9;       

char cmd[100];
int cmdIndex;


void exeCmd() {
  
  if( (cmd[0]=='b') && cmd[1]==' ' ) { 
       int val = 0;
       for(int i=2; cmd[i]!=0; i++) {
         val = val*10 + (cmd[i]-'0');
       }
       // if cmd is "b, 100", val will be 100        
       if(cmd[0]=='b') analogWrite(led, 0+val);
  } 

  
}


void setup() {
  
  delay(500); // wait for bluetooth module to start

  Serial.begin(115200); // Bluetooth default baud is 115200
  
  Serial.print("$");
  Serial.print("$");
  Serial.print("$"); // enter cmd mode
  delay(250);  
  Serial.println("U,9600,N"); // change baud to 9600
  
  Serial.begin(9600);
  
  pinMode(led, OUTPUT);
  digitalWrite(led, LOW);
  
  cmdIndex = 0;
}


void loop() {
  
  if(Serial.available()) {
    
    char c = (char)Serial.read();
    
    if(c=='\n') {
      cmd[cmdIndex] = 0;
      exeCmd();  // execute the command
      cmdIndex = 0; // reset the cmdIndex
    } else {      
      cmd[cmdIndex] = c;
      if(cmdIndex<99) cmdIndex++;
    }
   
    
  }
  
}
