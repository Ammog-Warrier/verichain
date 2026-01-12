#!/bin/bash
#
# Script to deploy VeriChain Contract
#

# Use custom endorsement policy: only require Org1 and Org2 (not all 4 orgs)
# Format: AND('Org1MSP.peer','Org2MSP.peer')
# Use sequence 2 to avoid conflict with previous uncommitted sequence 1
./network.sh deployCC -c verichain-channel -ccn verichain-contract -ccp ./chaincode/src -ccl javascript -ccep "AND('Org1MSP.peer','Org2MSP.peer')" -ccs 2 -cccg ./collections_config.json
