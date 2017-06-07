properties(
    [
        pipelineTriggers([cron('H 3 * * *')]),
    ]
)
    
pipeline {
    agent any

    stages {
        try{
            stage('Build') {
                steps {
                    sh "chmod +x $WORKSPACE/conf/scripts/install.sh"
                    sh "$WORKSPACE/conf/scripts/install.sh"
                }
            }
            stage('Test') {
                steps {
                    retry(3) {
                        sh "chmod +x $WORKSPACE/conf/scripts/test.sh"
                        sh "$WORKSPACE/conf/scripts/test.sh JENKINSTESTSdendroVagrantDemo root r00t_p4ssw0rd"
                    }
                }
            }
            stage('Deploy') {
                steps {
                    echo 'No deployments yet. Skipping.'
                    //sh "chmod +x $WORKSPACE/conf/scripts/deploy.sh"
                }
            }
        }
        finally
        {
            stage('Cleanup') {
                steps {
                    echo "Cleaning workspace at $WORKSPACE"
                    sh "rm -rf $WORKSPACE/*"
                }
            }
        }
    }
}
