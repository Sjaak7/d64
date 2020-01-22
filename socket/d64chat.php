<?php

class chat64
{
	private object $d64;
	private array $chatData;

	function __construct(object $parent)
	{
		$this->d64 = $parent;

		if($chatData = @file_get_contents('socket/chat.json'))
			$this->chatData = json_decode($chatData,true);
	}

	public function handshake(array $headers, int $key) : void
	{
		if(isset($headers['Cookie']) && $this->isValidNick(str_replace('chat=','',$headers['Cookie']))){
			if(!$this->isDuplicateNick(str_replace('chat=','',$headers['Cookie'])))
				$this->d64->addClientInfo(3,str_replace('chat=','',$headers['Cookie']),$key);
			else $this->d64->send(json_encode(['mod'=>'chat','err'=>'dup_nick']),false,$key);
		}
	}

	public function incomingData(array $data, int $key) : void
	{
		if(isset($data['rq'])){
			if($data['rq']==='init'){
				if(!isset($data['chan']))
					$chan='lobby';
				if($data=$this->getChatData($chan,true)){
					$this->d64->send($data,false,$key);
					// Send nick data to other users..
					if(isset($this->d64->getClientInfoArray()[$key][3]))
                				$this->d64->send(json_encode(['mod'=>'chat','nicks'=>$this->getNicks()]),true,0,'text',$key);
				}
			}elseif($data['rq']==='nick'){
				if(!$this->isDuplicateNick($data['nick'])){
					$this->d64->addClientInfo(3,$data['nick'],$key);
					$this->d64->send(json_encode(['mod'=>'chat','qjb'=>$data['nick']]),false,$key);
					$this->d64->send(json_encode(['mod'=>'chat','nicks'=>$this->getNicks()]),true);
				}else{
					$this->d64->send(json_encode(['mod'=>'chat','err'=>'dup_nick']),false,$key);
				}
			}
		}elseif(isset($data['msg'])){
			$this->handleChatData($data,$key);
		}elseif(isset($data['nN']) && $this->isValidNick($data['nN'])){
			if(!$this->isDuplicateNick($data['nN'])){
				$this->d64->addClientInfo(3,$data['nN'],$key);
				$this->d64->send(json_encode(['nicks'=>$this->getNicks()]),true,0);
			}else $this->d64->send(json_encode(['mod'=>'chat','err'=>'dup_nick']),false,$key);
		}elseif(isset($data['nC'])){
			$this->chatData['chan']['test']['chat']="test";
			$this->d64->addConsoleData('chat',['channels',count($this->chatData['chan'])]);
		}
	}

	public function closeConnection(int $key) : void
	{
		if($nicks = $this->getNicks())
			$this->d64->send(json_encode(['mod'=>'chat','nicks'=>$nicks]),true);
		else $this->d64->send(json_encode(['mod'=>'chat','nicks'=>'none']),true);
	}

	public function END() : void
	{
		echo "Saving chat file\n";
		$myfile = fopen("socket/chat.json", "w") or die("Unable to open file!");
		$this->chatData['mod']='chat';
		fwrite($myfile,json_encode($this->chatData));
		fclose($myfile);
	}

	private function handleChatData(array $data, int $key) : void
	{
		if(isset($data['msg']['n']) && $data['msg']['n']===$this->d64->getClientInfoArray()[$key][3] && $data['msg']['m']<=128){
			if(isset($this->chatData['chan'][$data['chan']]['chat']) && count($this->chatData['chan'][$data['chan']]['chat'])>29)
				array_shift($this->chatData['chan'][$data['chan']]['chat']);
			$this->chatData['chan'][$data['chan']]['chat'][] = ['n'=>$data['msg']['n'],'m'=>htmlentities($data['msg']['m'])];
			$this->sendChatData($data['chan'],false);
		}else $this->closeConnection($key);
	}

	private function isValidNick(string $nick) : bool
	{
		if(preg_match("/^([A-z0-9_-]{3,9})$/",$nick))
			return true;
		return false;
	}

	private function isDuplicateNick(string $nick) : bool
	{
		foreach($this->d64->getClientInfoArray() as $row)
			if(isset($row[3]) && strtolower($row[3])===strtolower($nick))
				return true;
		return false;
	}

        private function getNicks()
	{
		foreach($this->d64->getClientInfoArray() as $row)
			if($row!=='system' && isset($row[3]))
				$nicks[] = ['n'=>$row[3]];
		if(isset($nicks[0]))
			return $nicks;
		else return false;
	}

	private function getChatData(string $chan, bool $all)
	{
		if(isset($this->chatData['chan'][$chan])){
			$chat = [];
			if($all){
				foreach($this->chatData['chan'][$chan]['chat'] as $row)
					$chat[] = ['n'=>$row['n'],'m'=>$row['m']];
			}else{
				$lastRow = end($this->chatData['chan'][$chan]['chat']);
				$chat[] = ['n'=>$lastRow['n'],'m'=>$lastRow['m']];
			}
			$output = ['mod'=>'chat','chan'=>$chan,'chat'=>$chat];
			if($nicks = $this->getNicks())
				$output['nicks'] = $nicks;
			return json_encode($output);
		}else return false;
	}

	private function sendChatData(string $chan, bool $all) : void
	{
		if(isset($this->chatData['chan'][$chan]))
			$this->d64->send($this->getChatData($chan,$all),true);
	}
}

?>
