import React, { Component } from "react";
// import { connect } from "react-redux";
import {
  // CustomInput,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "reactstrap";
import { NotificationManager } from "../../components/common/react-notifications";
import IntlMessages from "../../helpers/IntlMessages";
import axios from 'axios';
import { backUrl } from "../../constants/defaultValues"

class Edituser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      strategy1:props.strategy1,
      strategy2:props.strategy2,
      strategy3:props.strategy3,
      _id:props.eachClient.id,
      name:props.eachClient.username,
      username:props.eachClient.name,
      email:props.eachClient.email,
      created_by:props.eachClient.manager,
      id:props.eachClient.keyId,
      sec:props.eachClient.keysec,
      exchange:props.eachClient.exchange,
      strategy:props.eachClient.strategy,
      param_id:props.eachClient.param,
      created_at:props.eachClient.created_at,
      // eachClient:props.eachClient,
      modal_show:props.modal_show
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props._id !== prevProps._id) {
      this.setState({_id: this.props._id});
    }
  }

  editclient(){
    console.log(this.state.param_id);
    axios
      .post(backUrl + '/api/edit_client', {_id:this.state._id,name:this.state.name,username:this.state.username,email:this.state.email,created_by:this.state.created_by,id:this.state.id,sec:this.state.sec,exchange:this.state.exchange,strategy:this.state.strategy,param_id:this.state.param_id,created_at:this.state.created_at})
      // .then(response => response.json())
      .then(async(result) => {
        if (result.status === 200) {
          if (result.data.message === "param no"){
            NotificationManager.warning("Please select correct parameters.","Client Edit : " + this.state.username.toUpperCase(),3000,null,"null",'');  
          }
          else if (result.data.message === "manager no"){
            NotificationManager.warning("Please select correct manager name.","Client Edit : " + this.state.username.toUpperCase(),3000,null,"null",'');  
          }
          else if (result.data.message === "email exist"){
            NotificationManager.warning("Eamil is already existed.","Client Edit : " + this.state.username.toUpperCase(),3000,null,"null",'');  
          }
          else if (result.data.message === "api no"){
            NotificationManager.warning("Please add correct api key.","Client Edit : " + this.state.username.toUpperCase(),3000,null,"null",'');  
          }
          else {
            NotificationManager.success(result.data.message + " successfully.","Client Edit : " + this.state.username.toUpperCase(),3000,null,"null",'');
            await this.sleep(2000);
            this.props.toggleModal();
          }
        }
        else {
          NotificationManager.success("Have problem.","Client Edit : " + this.state.username.toUpperCase(),3000,null,"null",'');
          await this.sleep(2000);
        }
      })
      .catch(err => {
        console.error(err);
      });
  }

  async sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  renderParam(){
    // console.log(this.state.strategy1,this.state.strategy2,this.state.strategy3);
    if (this.state.strategy === "strategy1"){
      return (
        <select className="col-md-8" defaultValue={this.state.param_id} onClick={event => {this.setState({ param_id: event.target.value });}}>
          {this.state.strategy1.map((param,index)=>{
            return (
              <option value={param.param} key={param.param}>{param.param}</option>
            );
          })}
        </select>
      );     
    }
    else if (this.state.strategy === "strategy2"){
      return (
        <select className="col-md-8" defaultValue={this.state.param_id} onClick={event => {this.setState({ param_id: event.target.value });}}>
          {this.state.strategy2.map((param,index)=>{
            return (
              <option value={param.param} key={param.param}>{param.param}</option>
            );
          })}
        </select>
      );  
    }
    else if (this.state.strategy === "strategy3"){
      return (
        <select className="col-md-8" defaultValue={this.state.param_id} onClick={event => {this.setState({ param_id: event.target.value });}}>
          {this.state.strategy3.map((param,index)=>{
            return (
              <option value={param.param} key={param.param}>{param.param}</option>
            );
          })}
        </select>
      );  
    }
  }

  renderStrategy(){
    return  (
      <ModalBody>
        <label className="col-md-4 param_model_text">Name</label>
        <input className="col-md-8" type="text" defaultValue={this.state.name} onChange={event => {this.setState({ name: event.target.value });}} required/>
        {/* <label className="col-md-4 param_model_text">Username</label>
        <input className="col-md-8" type="text" defaultValue={this.state.username} onChange={event => {this.setState({ username: event.target.value });}} required/> */}
        <label className="col-md-4 param_model_text">Email</label>
        <input className="col-md-8" type="text" defaultValue={this.state.email} onChange={event => {this.setState({ email: event.target.value });}} required/>
        <label className="col-md-4 param_model_text">Manager</label>
        <input className="col-md-8" type="text" defaultValue={this.state.created_by} onChange={event => {this.setState({ created_by: event.target.value });}} required/>
        <label className="col-md-4 param_model_text">KeyId</label>
        <input className="col-md-8" type="text" defaultValue={this.state.id} onChange={event => {this.setState({ id: event.target.value });}} required />
        <label className="col-md-4 param_model_text">KeySec</label>
        <input className="col-md-8" type="text" defaultValue={this.state.sec} onChange={event => {this.setState({ sec: event.target.value });}} required />
        {/* <label className="col-md-4 param_model_text">Exchange</label>
        <input className="col-md-8" type="text" defaultValue={this.state.exchange} onChange={event => {this.setState({ exchange: event.target.value });}} required disabled/> */}
        <label className="col-md-4 param_model_text">Strategy</label>
        <select className="col-md-8" defaultValue={this.state.strategy} onChange={event => {this.setState({ strategy: event.target.value });}}>
          <option value={"strategy1"}>Strategy1</option>
          <option value={"strategy2"}>Strategy2</option>
          <option value={"strategy3"}>Strategy3</option>
        </select>
        <label className="col-md-4 param_model_text">Parameter</label>
        {this.renderParam()}
        {/* <input className="col-md-8" type="text" defaultValue={this.state.strategy} onChange={event => {this.setState({ strategy: event.target.value });}} required/> */}        
        {/* <input className="col-md-8" type="text" defaultValue={this.state.param_id} onChange={event => {this.setState({ param_id: event.target.value });}} required/> */}
      </ModalBody>
    );
  }

  render() {
    const {toggleModal} = this.props;
    return (
      <Modal isOpen={this.state.modal_show}>
        <ModalHeader className="h5">{"Client Edit : " + this.state.email }</ModalHeader>
        {this.renderStrategy()}
        <ModalFooter>
        <Button className="w-30 m-auto" color="primary" onClick={() => this.editclient()}><IntlMessages id="param.update" /></Button>
          <Button className="w-30 m-auto" color="secondary" outline onClick={toggleModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

export default Edituser;
// module.exports = Editparam;