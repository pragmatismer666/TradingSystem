import React, { Component, Fragment } from "react";
import IntlMessages from "../../../helpers/IntlMessages";
import Button from 'react-bootstrap/Button';
import { NotificationManager } from "../../../components/common/react-notifications";
import { backUrl } from "../../../constants/defaultValues"
import Editparam from "../../../containers/applications/Editparam"
import axios from 'axios';

export default class Strategy extends Component {

  constructor() {
    super();
    this.state={
      headers: [
        "Strategy Name","Parameter","Total Users", "Delete Strategy", "Close All Trades", "Edit Parameter"
      ],
      strategys:[],
      modal_show:false,
      name:'strategy1',
      param:'parameter1'
    };
    if (localStorage.getItem('user_type') === "0"){
      this.getfullclients();
    }
    else{
      this.getclient(localStorage.getItem('user_id'));
    }
  }

  componentDidUpdate() {
    if (localStorage.getItem('user_type') === "0"){
      this.getfullclients();
    }
    else{
      this.getclient(localStorage.getItem('user_id'));
    }
  }
  
  async sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  toggleModal = () => {
    this.setState({
      modal_show: !this.state.modal_show
    });
  };

  getfullclients(){
    axios
      .get(backUrl + '/api/full_clients')
      .then((res) =>{
        var temp = [];
        for(var i=0;i<res.data.length;i++){
          temp.push(res.data[i]);
        }
        this.setState({strategys:temp});
      })      
      .catch(err => {
        console.error(err);
      });
  }

  getclient(user_id){
    axios
      .post(backUrl + '/api/client',{user_id})
      .then((res) =>{
        var temp = [];
        for(var i=0;i<res.data.length;i++){
          temp.push(res.data[i]);
        }
        this.setState({strategys:temp});
      })      
      .catch(err => {
        console.error(err);
      });
  }

  editParam(name,param) {    
    this.setState({name:name});
    this.setState({param:param});
    this.toggleModal();      
  }
 
  deleteParam(name,param) {   
    if ( window.confirm("Are you sure you wish to delete this item?") ){
      axios
        .post(backUrl + '/api/delete_param', {name,param})
        .then(async(res) =>{
          NotificationManager.success(name.toUpperCase() + " " + param.toUpperCase() + " are deleted successfully","Trade Order",5000,null,"null",'');
          await this.sleep(1000);
          this.setState({strategys:this.state.strategys});
        })      
        .catch(err => {
          console.error(err);
        });
      if (localStorage.getItem('user_type') === "0"){
        this.getfullclients();
      }
      else{
        this.getclient(localStorage.getItem('user_id'));
      }
    }    
  }

  closeParam(name,param) {
    if (window.confirm('Are you sure you wish to cancel this item?')){
      axios
      .post(backUrl + '/api/close_trades', {name,param})
      .then((res) =>{
        if (res.data.message === "no"){
          NotificationManager.warning(name.toUpperCase() + " " + param.toUpperCase() + " : No orders","Trade Order",3000,null,"null",''); 
        }
        else {
          NotificationManager.success(name.toUpperCase() + " " + param.toUpperCase() + "orders are closed successfully","Trade Order",3000,null,"null",'');
        }
      })      
      .catch(err => {
        console.error(err);
      });
      if (localStorage.getItem('user_type') === "0"){
        this.getfullclients();
      }
      else{
        this.getclient(localStorage.getItem('user_id'));
      }
    }
  }

  renderTableHeader() {
    if (localStorage.getItem('user_type') === "0"){
      let headers = [];
      this.state.headers.forEach(header => {
          headers.push(<th key={header}>{header.toUpperCase()}</th>);
      });
      return (<tr className="h6">{headers}</tr>);
    }
  }            

  renderTableData() {
    return this.state.strategys.map((strategy, index) => {
      if (localStorage.getItem('user_type') === "0"){
        return (
          <tr className="h5" key={[strategy.name,strategy.param]}>
            <td className="w-15">{strategy.name}</td>
            <td className="w-15">{strategy.param}</td>
            <td type="integer" className="w-15">{strategy.users}</td>
            <td className="w-20">
              <button className="btn-default w-100" onClick={(()=>{this.deleteParam(strategy.name,strategy.param)})}>
                Delete
              </button>
            </td>
            <td className="w-20">
              <button className="btn-default w-100" onClick={(()=>{this.closeParam(strategy.name,strategy.param)})}>
                Close
              </button>
            </td>
            <td className="w-20">
              <button className="btn-default w-100" onClick={(()=>{this.editParam(strategy.name,strategy.param)})}>
                Edit
              </button>
            </td>
          </tr>
        );
      }
      else {
        return (
          <tr className="h5" key={strategy.name}>
            <td className="w-15">{strategy.name}</td>
            <td className="w-15">{strategy.param}</td>
            <td type="integer" className="w-15">{strategy.users}</td>
          </tr>
        );
      }
    })
  }

  renderModal() {
    if(this.state.modal_show){
      return (<Editparam toggleModal={this.toggleModal} modal_show={this.state.modal_show} name={this.state.name} param={this.state.param}/>)
    }
  }

  renderbtns(){
    if (localStorage.getItem('user_type') === "0"){
      return (
        <div className="w-80" style={{marginTop:"3%",marginLeft:"10%",marginRight:"10%"}}>        
          <Button className="col-md-3 ml-4 mr-5" color="primary" onClick={() => this.editParam("strategy1","new")}><IntlMessages id="param.create" /> Strategy1 Parameter</Button>
          <Button className="col-md-3 ml-5 mr-5" color="primary" onClick={() => this.editParam("strategy2","new")}><IntlMessages id="param.create" /> Strategy2 Parameter</Button>
          <Button className="col-md-3 ml-5" color="primary" onClick={() => this.editParam("strategy3","new")}><IntlMessages id="param.create" /> Strategy3 Parameter</Button>
        </div>
      );
    }
  }

  render() {
    return (
      <Fragment>
        {this.renderModal()}
        <table className="clients w-80 m-auto">
          <tbody>        
            {this.renderTableHeader()}
            {this.renderTableData()}
          </tbody>
        </table>
          {this.renderbtns()}
    </Fragment>
    );
  }
}


