var serial = {};

console.log('serial.js');
(function() {
  'use strict';

  serial.getPorts = function() {
    return navigator.usb.getDevices().then(devices => {
      return devices.map(device => new serial.Port(device));
    });
  };

//{ 'vendorId': 0x2341, 'productId': 0x8037 },

  serial.requestPort = function() {
  
  
    console.log('navigator.usb.getDevices ...');
  	navigator.usb.getDevices().then(devices => {
  	devices.map(device => {
  	  console.log(device.productName);      // "Arduino Micro"
  	  console.log(device.manufacturerName); // "Arduino LLC"
 	 });
	})

  
  
    const filters = [
      { 'vendorId': 0x2c69, 'productId': 0x5750 },
      { 'vendorId': 0x15A2, 'productId': 0x0101 },
      { 'vendorId': 0x0483, 'productId': 0x5750 }
    ];
    console.log('navigator.usb.requestDevice ...');
    return navigator.usb.requestDevice({ 'filters': filters }).then(
      device => new serial.Port(device)
    );
  };

  serial.Port = function(device) {
    this.device_ = device;
  };

  serial.Port.prototype.connect = function() {
    let readLoop = () => {
      this.device_.transferIn(5, 64).then(result => {
        this.onReceive(result.data);
        readLoop();
      }, error => {
        this.onReceiveError(error);
      });
    };

    return this.device_.open()
        .then(() => {
          if (this.device_.configuration === null) {
            return this.device_.selectConfiguration(1);
          }
        })
        .then(() => this.device_.claimInterface(2))
        .then(() => this.device_.controlTransferOut({
            'requestType': 'class',
            'recipient': 'interface',
            'request': 0x22,
            'value': 0x01,
            'index': 0x02}))
        .then(() => {
          readLoop();
        });
  };

  serial.Port.prototype.disconnect = function() {
    return this.device_.controlTransferOut({
            'requestType': 'class',
            'recipient': 'interface',
            'request': 0x22,
            'value': 0x00,
            'index': 0x02})
        .then(() => this.device_.close());
  };

  serial.Port.prototype.send = function(data) {
    return this.device_.transferOut(4, data);
  };
})();
