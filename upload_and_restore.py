import pexpect
import sys

ip = "43.133.158.83"
user = "ubuntu"
password = "mountain-47#-thunder"
archive_path = "bemft-cms-dump.archive"

print("Starting SCP upload...")
child = pexpect.spawn(f'scp -o StrictHostKeyChecking=no {archive_path} {user}@{ip}:/tmp/')
child.expect('password:')
child.sendline(password)
child.expect(pexpect.EOF, timeout=120)
print(child.before.decode())
print("SCP upload complete.")

print("Starting SSH execution...")
ssh_command = f"""ssh -o StrictHostKeyChecking=no {user}@{ip} "
sudo docker cp /tmp/bemft-cms-dump.archive \\$(sudo docker ps -qf 'name=db-1'):/tmp/ &&
sudo docker exec \\$(sudo docker ps -qf 'name=db-1') mongorestore -u admin -p password --authenticationDatabase admin -d bemft-cms --archive=/tmp/bemft-cms-dump.archive --drop
" """

child = pexpect.spawn(ssh_command)
child.expect('password:')
child.sendline(password)
child.expect(pexpect.EOF, timeout=120)
print(child.before.decode())
print("SSH execution complete.")
