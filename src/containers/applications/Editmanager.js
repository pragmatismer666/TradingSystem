import React, { Component } from "react";
// import { connect } from "react-redux";
import {
  // CustomInput,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import { NotificationManager } from "../../components/common/react-notifications";
import IntlMessages from "../../helpers/IntlMessages";
import axios from 'axios';
import { backUrl } from "../../constants/defaultValues"

class Editmanager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      m_name:props.m_name,
      m_username:props.m_username,
      m_email:props.m_email,
      m_password:props.m_password,
      m_macomis:props.m_macomis,
      m_ucomis:props.m_ucomis,
      m_wallet:props.m_wallet,
      modal_show:props.modal_show
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.name !== prevProps.name) {
      this.setState({m_name:this.props.m_name});
      this.setState({m_username:this.props.m_username});
      this.setState({m_email:this.props.m_email});
      this.setState({m_password:this.props.m_password});
      this.setState({m_macomis:this.props.m_macomis});
      this.setState({m_ucomis:this.props.m_ucomis});
      this.setState({m_wallet:this.props.m_wallet});
    }
  }

  updateParam(){
    if (this.state.m_ucomis < 5){ NotificationManager.warning("Please set user commission higher than 5.","Manger Edit : " + this.state.m_email.toUpperCase(),3000,null,"null",''); }
    if (this.state.m_ucomis > 100){ NotificationManager.warning("Please set user commission lower than 100.","Manger Edit : " + this.state.m_email.toUpperCase(),3000,null,"null",''); }
    else {
      axios
      .post(backUrl + '/api/update_user', {name:this.state.m_name,username:this.state.m_username,email:this.state.m_email,password:this.state.m_password,m_comis:this.state.m_macomis,u_comis:(this.state.m_ucomis).toString(),wallet:this.state.m_wallet})
      // .then(response => response.json())
      .then(async(result) => {
        if (result.status === 200) {
          NotificationManager.success(result.data.message + " successfully.","Manger Edit : " + this.state.m_email.toUpperCase(),3000,null,"null",'');
          await this.sleep(2000);
          this.props.toggleModal();
        }
      })
      .catch(err => {
        console.error(err);
      });
    }
  }

  async sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  renderStrategy(){
    if ( this.state.m_username === "RooT858#" ){
      return  (
        <ModalBody>
          <label className="col-md-6 param_model_text">Name</label>
          <input className="col-md-6" type="text" defaultValue={this.state.m_name} onChange={event => {this.setState({ m_name: event.target.value });}} required/>
          <label className="col-md-6 param_model_text">Email</label>
          <input className="col-md-6" type="text" defaultValue={this.state.m_email} onChange={event => {this.setState({ m_email: event.target.value });}} required/>
          <label className="col-md-6 param_model_text">Password</label>
          <input className="col-md-6" type="text" defaultValue={this.state.m_password} onChange={event => {this.setState({ m_password: event.target.value });}} required/>
          <label className="col-md-6 param_model_text">Wallet</label>
          <input className="col-md-6" type="text" defaultValue={this.state.m_wallet} onChange={event => {this.setState({ m_wallet: event.target.value });}} required/>
        </ModalBody>
      );
    }
    else {
      return  (
        <ModalBody>
          <label className="col-md-6 param_model_text">Name</label>
          <input className="col-md-6" type="text" defaultValue={this.state.m_name} onChange={event => {this.setState({ m_name: event.target.value });}} required/>
          <label className="col-md-6 param_model_text">Email</label>
          <input className="col-md-6" type="text" defaultValue={this.state.m_email} onChange={event => {this.setState({ m_email: event.target.value });}} required/>
          <label className="col-md-6 param_model_text">Password</label>
          <input className="col-md-6" type="text" defaultValue={this.state.m_password} onChange={event => {this.setState({ m_password: event.target.value });}} required/>
          <label className="col-md-6 param_model_text">Manager Comission</label>
          <input className="col-md-6" type="text" defaultValue={this.state.m_macomis} onChange={event => {this.setState({ m_macomis: event.target.value });}} required/>
          <label className="col-md-6 param_model_text">Performace Fee</label>
          <input className="col-md-6" type="number" min={5} defaultValue={this.state.m_ucomis} onChange={event => {this.setState({ m_ucomis: event.target.value });}} required/>
          <label className="col-md-6 param_model_text">Wallet</label>
          <input className="col-md-6" type="text" defaultValue={this.state.m_wallet} onChange={event => {this.setState({ m_wallet: event.target.value });}} required/>
        </ModalBody>
      );
    }
  }

  render() {
    const {toggleModal} = this.props;
    return (
      <Modal
        isOpen={this.state.modal_show}
      >
        <ModalHeader className="h5">{"Manager Edit : " + this.state.m_email}</ModalHeader>
        {this.renderStrategy()}
        <ModalFooter>
        <Button className="w-30 m-auto" color="primary" onClick={() => this.updateParam()}><IntlMessages id="param.update" /></Button>
          <Button className="w-30 m-auto" color="secondary" outline onClick={toggleModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

export default Editmanager;