import React, { Component } from 'react';
import { Row, Table} from 'reactstrap';
import { NotificationManager } from "../../../components/common/react-notifications";
import Edituser from "../../../containers/applications/Edituser"
import axios from 'axios';
import { backUrl } from "../../../constants/defaultValues"

export default class Start extends Component{

  constructor(){
    super();
    this.state={
      headers:["No","UserName","Email","Balance","Startegy","Parameter","Manager","Edit","Start","Pause","Delete","Status"],
      mheaders:["UserName","Email","Balance","Parameter","Status"],
      eachClient:{},
      modal_show:false,
      allclients:[],
      strategy1:[],
      strategy2:[],
      strategy3:[],
      total:""
    };
    this.getStrategy1();
    this.getStrategy2();
    this.getStrategy3();
    this.getUserData();
  }

  getUserData(){
    axios
      .get(backUrl + '/api/backend_client')
      .then((result) => {
        console.log(result.data);
        if ( localStorage.getItem("user_type") === "1" ){
          var partclients = [];
          console.log(localStorage.getItem("user_name"), " User Name ");
          for (var i=0;i<result.data.length;i++){
            if (result.data[i].manager === localStorage.getItem("user_name")){ partclients.push(result.data[i]); }
          }
          this.setState({allclients:partclients});
        }
        else { this.setState({allclients:result.data}); }
      })
      .catch(err => { console.error(err); });
  }

  getStrategy1(){
    axios
      .get(backUrl + '/special/strategy1')
      .then((result) => { this.setState({strategy1:result.data}) })
      .catch(err => { console.error(err); });
  }

  getStrategy2(){
    axios
      .get(backUrl + '/special/strategy2')
      .then((result) => { this.setState({strategy2:result.data}); })
      .catch(err => { console.error(err); });
  } 

  getStrategy3(){
    axios
      .get(backUrl + '/special/strategy3')
      .then((result) => { this.setState({strategy3:result.data}) })
      .catch(err => { console.error(err); });
  } 

  start(email,exchange,key,sec,strategy,param){
    axios
    .post(backUrl + '/api/client_start',{email:email,exchange:exchange,key:key,sec:sec,strategy:strategy,option:param})
    .then((res)=>{
      if (res.data.success === "No orders"){
        NotificationManager.success("Amount : "+res.data.amount + " successfully.",email + " Start" ,3000,null,"null",'');  
        this.getUserData();
      }
      else if (res.data.success === "price"){
        NotificationManager.success("Please update top or bottom price in strategy2" , "Now BTC price : " + res.data.amount,3000,null,"null",'');  
      }
      else if (res.data.success === "orders"){
        NotificationManager.warning(" : Already running." ,email + " : Running" ,3000,null,"null",'');  
      }
      else if (res.data.success === "api"){
        NotificationManager.warning("Have problem in API KEY or Limit.", email + " Start" ,3000,null,"null",'');  
      }
      else if (res.data.success === "problem"){
        NotificationManager.warning("Have too less amount to trading in account.", email + " Start" ,3000,null,"null",'');  
      }
      else {
        NotificationManager.warning("Have other problem.", email + " Start" ,3000,null,"null",'');  
      }
    })
    .catch(err => {
        NotificationManager.error("Have error in start.", email + " Start" ,3000,null,"null",'');  
        console.error(err);
    });
  }

  pause(email,exchange,key,sec,strategy){
    if (window.confirm('Are you sure you wish to pause this item?')) {
      axios
      .post(backUrl + '/api/client_pause',{email:email,exchange:exchange,key:key,sec:sec,strategy:strategy})
      .then((res)=>{
        NotificationManager.success("Paused as successfully.",email + " Pause" ,5000,null,"null",'');
        this.getUserData();
      })
      .catch(err => {
        NotificationManager.error("Have error in pause.",email + " Pause" ,5000,null,"null",'');  
        console.error(err);
      });
    }
  }

  delete(email,id){
    if (window.confirm('Are you sure you wish to delete this item?')) {
      axios
      .post(backUrl + '/api/client_delete',{user_id:id})
      .then((res)=>{
        this.getUserData();
        NotificationManager.warning(email + " is deleted.","DELETE : " + email ,5000,null,"null",'');
      })
      .catch(err => {
          NotificationManager.error("Have error.", "DELETE : " + email,5000,null,"null",'');  
          console.error(err);
      });
      this.getUserData();
    }
  }

  toggleModal = () => {
    this.setState({
        modal_show: !this.state.modal_show
    });
    this.getUserData();
  };

  edit(client){
    if (client.status !== "pause") {
      NotificationManager.warning("Please edit after change status to pause.", "Warning : Edit",5000,null,"null",'');  
    }
    else {
      this.setState({eachClient:client});
        this.toggleModal();	
    }
  }

  totalpause(){
    this.setState({total:""});
    if (window.confirm("Are you sure you wish to pause every account?")){
      axios
      .get(backUrl + '/api/total_pause')
      .then((res)=>{
        console.log(res);
        if (res.data.message === "no"){ NotificationManager.success("Pause every accounts.", " Total Pause ", 3000,null,"null",''); }
        else { NotificationManager.success("Get result of total pause.", " Total Pause ", 3000, null,"null",''); this.getUserData(); 
          this.setState({total:res.data.message.toString()});
        }
        this.getUserData();
      })
      .catch(err => {
          NotificationManager.error("Have error.", " Total Pause ",5000,null,"null",'');  
          console.error(err);
      });
    }
  }

  totalsync(){
    if (window.confirm("Are you sure you wish to sync take profit in every account?")){
      axios
      .get(backUrl + '/api/total_sync')
      .then((res)=>{
        console.log(res);
        if (res.data.message === "sync"){ NotificationManager.success("Sync every accounts.", " Total Sync ", 3000,null,"null",''); }
      })
      .catch(err => {
          NotificationManager.error("Have error.", " Total Sync ",3000,null,"null",'');  
          console.error(err);
      });
    }
  }

  renderModal(){
    if(this.state.modal_show){
      return (<Edituser toggleModal={this.toggleModal} modal_show={this.state.modal_show} eachClient={this.state.eachClient} strategy1={this.state.strategy1} strategy2={this.state.strategy2} strategy3={this.state.strategy3}/>)
    }
  }

  renderTableHeader() {
    if (localStorage.getItem('user_type') === "0") {
      let headers = [];
      this.state.headers.forEach(header => {
          headers.push(<th key={header}>{header.toUpperCase()}</th>);
      });
      return (<tr className="h6 w-100">{headers}</tr>);
    }
    else {
      let mheaders = [];
      this.state.mheaders.forEach(header => {
          mheaders.push(<th key={header}>{header.toUpperCase()}</th>);
      });
      return (<tr className="h6 w-100">{mheaders}</tr>);
    }
  }

  renderTableData() {
    if (this.state.allclients.length > 0 ){
      return this.state.allclients.map((client, index) => {
        const { id, name,email,balance,exchange,keyId,keysec,strategy,manager,param,pname,status} = client //destructuring
        if (localStorage.getItem('user_type') === "0") {
          return (
            <tr className="h5" key={email}>
              <td className="w-2">{index+1}</td>
              <td className="w-10">{name}</td>
              <td className="w-20">{email}</td>
              <td className="w-4">{balance}</td>
              <td className="w-6">{strategy}</td>
              <td className="w-8">{pname}</td>
              <td className="w-8">{manager}</td>
              <td className="w-8">
                <button id={client.id + "start"} className="btn-default h5 mb-0" onClick={(()=>{this.edit(client)})}>Edit</button>
              </td>
              <td className="w-8">
                <button id={client.id + "start"} className="btn-default h5 mb-0" onClick={(()=>{this.start(email,exchange,keyId,keysec,strategy,param)})}>Start</button>
              </td>
              <td className="w-8">
                <button id={client.id + "pause"} className="btn-default h5 mb-0" onClick={(()=>{this.pause(email,exchange,keyId,keysec,strategy)})}>Pause</button>
              </td>
              <td className="w-8">
                <button id={client.id + "delete"} className="btn-default h5 rounded-0 mb-0" onClick={(()=>{this.delete(email,id)})}>Delete</button>
              </td>
              <td className="w-8">{status.toUpperCase()}</td>
            </tr>    
          );
        }
        else {
          return (
            <tr className="h5" key={email}>
              <td className="w-10">{name}</td>
              <td className="w-20">{email}</td>
              <td className="w-4">{balance}</td>
              <td className="w-8">{pname}</td>
              <td className="w-8">{status.toUpperCase()}</td>
            </tr>
          );
        }
      });
    }
    else {
      return null;
    }
  }
  
  rendertotal() {
    if ( localStorage.getItem("user_type") === "0" ){
      return (
        <Row className="ml-1 w-100">
          <button className="btn-default w-10 mr-4 h-5" onClick={(()=>{this.totalsync()})}>Sync</button>
          <button className="btn-default w-10 mr-4 h-5" onClick={(()=>{this.totalpause()})}>Total Pause</button>
          <input className="w-70 h-5" type="text" defaultValue={this.state.total} />
        </Row>
      );
    }
  }

  render() {
    return (
      <Row className="w-95 mr-2 ml-2">
          {this.rendertotal()}
          {this.renderModal()}
          <Table id='report' className="clients h5">
              <tbody>
                  {this.renderTableHeader()}
                  {this.renderTableData()}
              </tbody>
          </Table>
      </Row>
    )
  }
}
