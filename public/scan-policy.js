/* Pure stability gate: a saved/queued paper must leave the frame before rearming. */
(function(root){
  class ScanGate {
    constructor(){this.reset()}
    reset(){this.signature='';this.since=0;this.count=0;this.latched=false;this.missing=0}
    accept(signature,now){
      if(!signature){this.signature='';this.count=0;if(!this.missing)this.missing=now;if(now-this.missing>=1400)this.latched=false;return false}
      this.missing=0;if(this.latched)return false;
      if(signature!==this.signature){this.signature=signature;this.since=now;this.count=1;return false}
      this.count++;return this.count>=3&&now-this.since>=1000;
    }
    latch(){this.latched=true;this.signature='';this.count=0}
    pause(){this.signature='';this.count=0;this.missing=0}
  }
  root.ScanGate=ScanGate;if(typeof module!=='undefined')module.exports={ScanGate};
})(typeof window!=='undefined'?window:globalThis);
