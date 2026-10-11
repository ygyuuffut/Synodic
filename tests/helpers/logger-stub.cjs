/* Only isolated unit fixtures omit the logger bootstrap/browser environment. */
module.exports=()=>({scope:()=>({debug(){},info(){},warn(){},error(){},fatal(){}})});
